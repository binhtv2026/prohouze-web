import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contractsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';

const DEMO_CONTRACTS = [
  { id: 'contract-1', contract_number: 'HĐ-2026-001', customer_name: 'Nguyễn Thành Long', product_name: 'Rivera A12', project_name: 'Rivera Residence', total_value: 3200000000, paid_amount: 1280000000, remaining_amount: 1920000000, status: 'active', created_at: new Date().toISOString() },
  { id: 'contract-2', contract_number: 'HĐ-2026-002', customer_name: 'Phạm Hương Giang', product_name: 'Sunrise B08', project_name: 'Sunrise Premium', total_value: 2850000000, paid_amount: 2850000000, remaining_amount: 0, status: 'completed', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'contract-3', contract_number: 'HĐ-2026-003', customer_name: 'Lê Hoàng Việt', product_name: 'Skyline C05', project_name: 'Skyline Heights', total_value: 1980000000, paid_amount: 300000000, remaining_amount: 1680000000, status: 'active', created_at: new Date(Date.now() - 12 * 86400000).toISOString() },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadContracts = useCallback(async () => {
    try {
      const response = await contractsAPI.getAll();
      setContracts(Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_CONTRACTS);
    } catch (error) {
      setContracts(DEMO_CONTRACTS);
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Đang thực hiện', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || badges.active;
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const totalValue = contracts.reduce((sum, c) => sum + c.total_value, 0);
  const totalPaid = contracts.reduce((sum, c) => sum + c.paid_amount, 0);
  const totalRemaining = contracts.reduce((sum, c) => sum + c.remaining_amount, 0);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="contracts-page">
      <Header title="Hợp đồng" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#316585]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#316585]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{contracts.length}</p>
                <p className="text-sm text-slate-500">Tổng hợp đồng</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-slate-500">Tổng giá trị</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
                <p className="text-sm text-slate-500">Đã thu</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRemaining)}</p>
                <p className="text-sm text-slate-500">Còn lại</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-slate-700">Số HĐ</TableHead>
                  <TableHead className="font-bold text-slate-700">Khách hàng</TableHead>
                  <TableHead className="font-bold text-slate-700">Dự án</TableHead>
                  <TableHead className="font-bold text-slate-700">Giá trị</TableHead>
                  <TableHead className="font-bold text-slate-700">Đã thanh toán</TableHead>
                  <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
                  <TableHead className="font-bold text-slate-700">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} className="table-row-hover">
                    <TableCell className="font-mono text-sm font-medium text-[#316585]">
                      {contract.contract_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{contract.customer_name}</p>
                        <p className="text-xs text-slate-500">{contract.product_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{contract.project_name}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(contract.total_value)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-green-600">{formatCurrency(contract.paid_amount)}</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(contract.paid_amount / contract.total_value) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {formatDate(contract.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
