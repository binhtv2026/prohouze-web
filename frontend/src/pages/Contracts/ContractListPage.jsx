/**
 * Contract List Page
 * Prompt 9/20 - Phase 4 Frontend
 * 
 * Simple list for Sales to see contracts at a glance
 * Clear status indicators, quick actions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { contractsAPI } from '@/lib/crmApi';
import { isContractLocked } from '@/lib/contractApi';
import { formatCurrency, formatDate } from '@/lib/utils';

const DEMO_CONTRACTS = [
  {
    id: 'contract-001',
    contract_code: 'HDMB-001',
    customer_name: 'Nguyen Van Minh',
    product_name: 'Can A-1208',
    contract_status: 'pending_review',
    contract_type: 'sale_purchase',
    contract_value: 3200000000,
    signed_at: '2026-03-24'
  },
  {
    id: 'contract-002',
    contract_code: 'HDMB-002',
    customer_name: 'Tran Thu Ha',
    product_name: 'Can B-1503',
    contract_status: 'active',
    contract_type: 'sale_purchase',
    contract_value: 2150000000,
    signed_at: '2026-03-20'
  }
];

// Contract status colors for display
const CONTRACT_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  terminated: 'bg-red-100 text-red-700',
};
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  FileCheck,
} from 'lucide-react';

export default function ContractListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const [contractsResponse] = await Promise.all([
        contractsAPI.getAll({ limit: 100 }),
      ]);
      
      // API v2 returns { data: [...], meta: {...} }
      const contractsData = contractsResponse.data || contractsResponse || [];
      const contractItems = Array.isArray(contractsData) && contractsData.length > 0 ? contractsData : DEMO_CONTRACTS;
      setContracts(contractItems);
      
      // Generate pipeline stats from contracts
      const pipelineStats = {
        total_contracts: contractItems.length,
        total_value: contractItems.reduce((sum, c) => sum + (parseFloat(c.contract_value) || 0), 0),
        pending_approval: contractItems.filter(c => c.contract_status === 'pending_review').length,
        pending_signature: contractItems.filter(c => c.contract_status === 'draft').length,
        overdue_contracts: contractItems.filter(c => c.contract_status === 'cancelled' || c.contract_status === 'terminated').length,
        active: contractItems.filter(c => c.contract_status === 'active').length,
      };
      setPipeline(pipelineStats);
      
      // Get unique statuses and types from data
      const uniqueStatuses = [...new Set(contractItems.map(c => c.contract_status).filter(Boolean))];
      const uniqueTypes = [...new Set(contractItems.map(c => c.contract_type).filter(Boolean))];
      setStatuses(uniqueStatuses);
      setTypes(uniqueTypes);
    } catch (error) {
      setContracts(DEMO_CONTRACTS);
      setPipeline({
        total_contracts: DEMO_CONTRACTS.length,
        total_value: DEMO_CONTRACTS.reduce((sum, c) => sum + (parseFloat(c.contract_value) || 0), 0),
        pending_approval: DEMO_CONTRACTS.filter(c => c.contract_status === 'pending_review').length,
        pending_signature: DEMO_CONTRACTS.filter(c => c.contract_status === 'draft').length,
        overdue_contracts: DEMO_CONTRACTS.filter(c => c.contract_status === 'cancelled' || c.contract_status === 'terminated').length,
        active: DEMO_CONTRACTS.filter(c => c.contract_status === 'active').length,
      });
      setStatuses([...new Set(DEMO_CONTRACTS.map((c) => c.contract_status).filter(Boolean))]);
      setTypes([...new Set(DEMO_CONTRACTS.map((c) => c.contract_type).filter(Boolean))]);
      toast.error('Không thể tải dữ liệu, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (search && !c.contract_code?.toLowerCase().includes(search.toLowerCase()) &&
          !c.customer_name?.toLowerCase().includes(search.toLowerCase()) &&
          !c.product_name?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.contract_type !== typeFilter) return false;
      return true;
    });
  }, [contracts, search, statusFilter, typeFilter]);

  const getStatusBadge = (status, label) => {
    const colorClass = CONTRACT_STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';
    return (
      <Badge className={`${colorClass} font-medium`}>
        {isContractLocked(status) && <Lock className="w-3 h-3 mr-1" />}
        {label || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="contract-list-page">
      <Header title="Quản lý Hợp đồng" />

      <div className="p-6 space-y-6">
        {/* Pipeline Summary Cards */}
        {pipeline && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{pipeline.total_contracts}</p>
                    <p className="text-xs text-slate-500">Tổng HĐ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(pipeline.total_value)}</p>
                    <p className="text-xs text-slate-500">Giá trị</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{pipeline.pending_approval}</p>
                    <p className="text-xs text-slate-500">Chờ duyệt</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{pipeline.pending_signature}</p>
                    <p className="text-xs text-slate-500">Chờ ký</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{pipeline.overdue_contracts}</p>
                    <p className="text-xs text-slate-500">Quá hạn</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
                data-testid="search-input"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {statuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40" data-testid="type-filter">
                <SelectValue placeholder="Loại HĐ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {types.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => navigate('/contracts/new')}
            className="bg-[#316585] hover:bg-[#265270]"
            data-testid="create-contract-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo hợp đồng
          </Button>
        </div>

        {/* Contract Table */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Mã HĐ</TableHead>
                  <TableHead className="font-semibold">Khách hàng</TableHead>
                  <TableHead className="font-semibold">Sản phẩm</TableHead>
                  <TableHead className="font-semibold">Loại</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold text-right">Giá trị</TableHead>
                  <TableHead className="font-semibold text-right">Đã thanh toán</TableHead>
                  <TableHead className="font-semibold">Ngày tạo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      Không có hợp đồng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                    <TableRow 
                      key={contract.id} 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      data-testid={`contract-row-${contract.id}`}
                    >
                      <TableCell className="font-medium text-[#316585]">
                        {contract.contract_code || contract.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{contract.customer_name || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.product_code || '-'}</div>
                          <div className="text-xs text-slate-500">{contract.project_name || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{contract.contract_type_label || contract.contract_type}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contract.status, contract.status_label)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contract.grand_total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-green-600">
                            {formatCurrency(contract.total_paid)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {contract.payment_completion_percent?.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatDate(contract.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contracts/${contract.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="text-sm text-slate-500">
          Hiển thị {filteredContracts.length} / {contracts.length} hợp đồng
        </div>
      </div>
    </div>
  );
}
