import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  FileCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  renewing: 'bg-blue-100 text-blue-700',
};

export default function LicensesPage() {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(false);
    setLicenses([
      { id: '1', name: 'Giấy phép kinh doanh', number: 'GPKD-001234', issued_by: 'Sở KH&ĐT TP.HCM', issue_date: '2020-01-15', expiry_date: '2030-01-15', status: 'active' },
      { id: '2', name: 'Giấy chứng nhận ĐKKD', number: 'ĐKKD-567890', issued_by: 'Sở KH&ĐT TP.HCM', issue_date: '2020-01-15', expiry_date: null, status: 'active' },
      { id: '3', name: 'Giấy phép môi giới BĐS', number: 'MGBDS-2024-001', issued_by: 'Sở Xây dựng', issue_date: '2024-01-01', expiry_date: '2026-01-01', status: 'active' },
      { id: '4', name: 'Chứng nhận PCCC', number: 'PCCC-2023-456', issued_by: 'Cảnh sát PCCC', issue_date: '2023-06-01', expiry_date: '2026-02-28', status: 'renewing' },
      { id: '5', name: 'Giấy phép quảng cáo', number: 'QC-2025-123', issued_by: 'Sở VHTT', issue_date: '2025-01-01', expiry_date: '2025-03-01', status: 'pending' },
    ]);
  }, []);

  const filteredLicenses = licenses.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="licenses-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Giấy phép & Pháp lý</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý giấy phép và chứng nhận pháp lý</p>
        </div>
        <Button data-testid="add-license-btn">
          <Plus className="h-4 w-4 mr-2" />
          Thêm giấy phép
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Còn hiệu lực</p>
                <p className="text-xl font-bold text-green-700">{licenses.filter(l => l.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Sắp hết hạn</p>
                <p className="text-xl font-bold text-amber-700">{licenses.filter(l => l.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Đang gia hạn</p>
                <p className="text-xl font-bold text-blue-700">{licenses.filter(l => l.status === 'renewing').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-red-600">Hết hạn</p>
                <p className="text-xl font-bold text-red-700">{licenses.filter(l => l.status === 'expired').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Tìm kiếm giấy phép..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Licenses List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredLicenses.map((license) => (
              <div key={license.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`license-${license.id}`}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileCheck className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{license.name}</p>
                      <Badge className={statusColors[license.status]}>
                        {license.status === 'active' ? 'Hiệu lực' :
                         license.status === 'pending' ? 'Sắp hết hạn' :
                         license.status === 'renewing' ? 'Đang gia hạn' : 'Hết hạn'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span>Số: {license.number}</span>
                      <span>Cấp bởi: {license.issued_by}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {license.expiry_date ? (
                      <>
                        <p className="text-sm font-medium">Hết hạn</p>
                        <p className="text-sm text-slate-500">{new Date(license.expiry_date).toLocaleDateString('vi-VN')}</p>
                      </>
                    ) : (
                      <p className="text-sm text-green-600">Vĩnh viễn</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
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
