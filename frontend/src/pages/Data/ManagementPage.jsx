import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DataManagementPage() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success('Đồng bộ dữ liệu thành công!');
    }, 2000);
  };

  return (
    <div className="space-y-6" data-testid="data-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý dữ liệu</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý và đồng bộ dữ liệu hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ'}
          </Button>
        </div>
      </div>

      {/* Data Sources Status */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Nguồn hoạt động</p>
                <p className="text-2xl font-bold text-green-700">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Cần kiểm tra</p>
                <p className="text-2xl font-bold text-amber-700">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Dữ liệu</p>
                <p className="text-2xl font-bold text-blue-700">2.5 GB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Cập nhật gần nhất</p>
                <p className="text-lg font-bold text-purple-700">5 phút trước</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            Nguồn dữ liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'CRM Database', type: 'MongoDB', status: 'active', records: '125,430', lastSync: '5 phút trước' },
              { name: 'Marketing Hub', type: 'API', status: 'active', records: '45,200', lastSync: '10 phút trước' },
              { name: 'Finance System', type: 'PostgreSQL', status: 'active', records: '89,150', lastSync: '15 phút trước' },
              { name: 'HR Management', type: 'API', status: 'active', records: '2,340', lastSync: '20 phút trước' },
              { name: 'Market Data Feed', type: 'External API', status: 'warning', records: '15,000', lastSync: '2 giờ trước' },
            ].map((source, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className={`h-5 w-5 ${source.status === 'active' ? 'text-green-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-slate-500">{source.type} | {source.records} records</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{source.lastSync}</span>
                  <Badge className={source.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {source.status === 'active' ? 'Hoạt động' : 'Cần kiểm tra'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng dữ liệu chính</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Leads', count: '12,500', icon: '👥' },
              { name: 'Customers', count: '3,400', icon: '🏠' },
              { name: 'Properties', count: '850', icon: '🏢' },
              { name: 'Transactions', count: '2,150', icon: '💰' },
              { name: 'Contracts', count: '1,890', icon: '📄' },
              { name: 'Employees', count: '245', icon: '👤' },
              { name: 'Tasks', count: '5,600', icon: '✅' },
              { name: 'Messages', count: '45,000', icon: '💬' },
            ].map((table, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl mb-1">{table.icon}</p>
                <p className="font-medium">{table.name}</p>
                <p className="text-sm text-slate-500">{table.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
