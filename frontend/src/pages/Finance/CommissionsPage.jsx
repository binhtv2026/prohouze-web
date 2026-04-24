/**
 * Commissions Page - Quản lý Hoa hồng
 * Gom 3 chức năng: Danh sách / Chính sách / Duyệt
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  TrendingUp, FileText, User, Users, Building,
  Search, Eye, DollarSign, Percent, Settings, CheckSquare,
  List, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import {
  getFinanceCommissions,
  getFinanceCommission,
  getCommissionSplits,
} from '../../api/financeApi';

const DEMO_COMMISSIONS = [
  {
    id: 'commission-001',
    code: 'HH-260318-01',
    contract_code: 'HD-260318',
    status: 'split',
    status_label: 'Đã chia',
    status_color: 'purple',
    project_name: 'The Horizon City',
    customer_name: 'Pham Anh Khoa',
    contract_value: 4200000000,
    commission_rate: 2.2,
    total_commission: 92400000,
    sale_name: 'Nguyen Minh Quan',
    leader_name: 'Le Hoang Nam',
    has_affiliate: false,
  },
  {
    id: 'commission-002',
    code: 'HH-260321-02',
    contract_code: 'HD-260321',
    status: 'pending',
    status_label: 'Chờ xác nhận',
    status_color: 'yellow',
    project_name: 'Central Avenue',
    customer_name: 'Tran Minh Chau',
    contract_value: 5600000000,
    commission_rate: 2.5,
    total_commission: 140000000,
    sale_name: 'Tran Bao Chau',
    leader_name: 'Le Hoang Nam',
    has_affiliate: true,
    ref_name: 'CTV Lan Anh',
  },
];

const DEMO_SPLITS = [
  {
    id: 'split-001',
    recipient_role: 'sale',
    recipient_role_label: 'Sale',
    recipient_name: 'Nguyen Minh Quan',
    split_percent: 60,
    gross_amount: 55440000,
    tax_rate: 10,
    tax_amount: 5544000,
    net_amount: 49896000,
    status: 'approved',
    status_label: 'Đã duyệt',
    status_color: 'blue',
    paid_at: null,
  },
  {
    id: 'split-002',
    recipient_role: 'leader',
    recipient_role_label: 'Leader',
    recipient_name: 'Le Hoang Nam',
    split_percent: 10,
    gross_amount: 9240000,
    tax_rate: 10,
    tax_amount: 924000,
    net_amount: 8316000,
    status: 'pending',
    status_label: 'Chờ chi',
    status_color: 'yellow',
    paid_at: null,
  },
];

// Format số tiền
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Status badge
function StatusBadge({ status, label, color }) {
  const colorMap = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <Badge className={`${colorMap[color] || colorMap.yellow} font-medium`}>
      {label || status}
    </Badge>
  );
}

// Commission Card
function CommissionCard({ commission, onViewDetails }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-sm">{commission.code}</p>
            <p className="text-xs text-gray-500">HĐ: {commission.contract_code}</p>
          </div>
          <StatusBadge 
            status={commission.status}
            label={commission.status_label}
            color={commission.status_color}
          />
        </div>

        {/* Project */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <Building className="w-4 h-4" />
          <span className="truncate">{commission.project_name || 'Dự án'}</span>
        </div>

        {/* Customer */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="truncate">{commission.customer_name || 'Khách hàng'}</span>
        </div>

        {/* Values */}
        <div className="space-y-1 p-2 bg-gray-50 rounded mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Giá trị HĐ:</span>
            <span className="font-medium">{formatCurrency(commission.contract_value)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">% Hoa hồng:</span>
            <span className="font-medium">{commission.commission_rate}%</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-1 mt-1">
            <span className="font-medium">Tổng hoa hồng:</span>
            <span className="font-bold text-green-600">{formatCurrency(commission.total_commission)}</span>
          </div>
        </div>

        {/* Sale info */}
        <div className="text-xs text-gray-500 space-y-1 mb-3">
          <div className="flex justify-between">
            <span>Sale:</span>
            <span className="font-medium text-gray-700">{commission.sale_name || '-'}</span>
          </div>
          {commission.leader_name && (
            <div className="flex justify-between">
              <span>Leader:</span>
              <span className="font-medium text-gray-700">{commission.leader_name}</span>
            </div>
          )}
          {commission.has_affiliate && (
            <div className="flex justify-between">
              <span>Affiliate:</span>
              <span className="font-medium text-orange-600">{commission.ref_name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onViewDetails(commission)}
          className="w-full"
        >
          <Eye className="w-3 h-3 mr-1" />
          Xem chi tiết chia
        </Button>
      </CardContent>
    </Card>
  );
}

// Commission Detail Dialog
function CommissionDetailDialog({ open, onClose, commission }) {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSplits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCommissionSplits({ commission_id: commission.id });
      setSplits(Array.isArray(data) && data.length > 0 ? data : DEMO_SPLITS);
    } catch (error) {
      setSplits(DEMO_SPLITS);
    } finally {
      setLoading(false);
    }
  }, [commission]);

  useEffect(() => {
    if (open && commission) {
      loadSplits();
    }
  }, [commission, loadSplits, open]);

  const roleColors = {
    sale: 'bg-blue-100 text-blue-700',
    leader: 'bg-purple-100 text-purple-700',
    company: 'bg-gray-100 text-gray-700',
    affiliate: 'bg-orange-100 text-orange-700',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết chia hoa hồng</DialogTitle>
        </DialogHeader>
        
        {commission && (
          <div className="space-y-4">
            {/* Commission info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Mã:</span>
                <span className="font-semibold">{commission.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Giá trị HĐ:</span>
                <span className="font-semibold">{formatCurrency(commission.contract_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">% Hoa hồng dự án:</span>
                <span className="font-semibold">{commission.commission_rate}%</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-medium">Tổng hoa hồng:</span>
                <span className="font-bold text-green-600">{formatCurrency(commission.total_commission)}</span>
              </div>
            </div>

            {/* Splits */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Phân chia hoa hồng
              </h4>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : splits.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có dữ liệu chia</p>
              ) : (
                <div className="space-y-2">
                  {splits.map(split => (
                    <div key={split.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={roleColors[split.recipient_role]}>
                            {split.recipient_role_label}
                          </Badge>
                          <span className="font-medium text-sm">{split.recipient_name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {split.split_percent}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-1 bg-gray-50 rounded">
                          <p className="text-gray-500">Trước thuế</p>
                          <p className="font-semibold">{formatCurrency(split.gross_amount)}</p>
                        </div>
                        <div className="text-center p-1 bg-red-50 rounded">
                          <p className="text-gray-500">Thuế TNCN ({split.tax_rate}%)</p>
                          <p className="font-semibold text-red-600">-{formatCurrency(split.tax_amount)}</p>
                        </div>
                        <div className="text-center p-1 bg-green-50 rounded">
                          <p className="text-gray-500">Thực nhận</p>
                          <p className="font-semibold text-green-600">{formatCurrency(split.net_amount)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <StatusBadge 
                          status={split.status}
                          label={split.status_label}
                          color={split.status_color}
                        />
                        {split.paid_at && (
                          <span className="text-xs text-gray-500">
                            Đã trả: {formatDate(split.paid_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Main Page
export default function CommissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'list');
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getFinanceCommissions(params);
      setCommissions(Array.isArray(data) && data.length > 0 ? data : DEMO_COMMISSIONS);
    } catch (error) {
      setCommissions(DEMO_COMMISSIONS);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  function handleViewDetails(commission) {
    setSelectedCommission(commission);
    setDetailDialogOpen(true);
  }

  // Filter
  const filteredCommissions = commissions.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.contract_code?.toLowerCase().includes(q) ||
      c.project_name?.toLowerCase().includes(q) ||
      c.customer_name?.toLowerCase().includes(q) ||
      c.sale_name?.toLowerCase().includes(q)
    );
  });

  // Summary
  const summary = {
    total: filteredCommissions.length,
    totalContractValue: filteredCommissions.reduce((sum, c) => sum + (c.contract_value || 0), 0),
    totalCommission: filteredCommissions.reduce((sum, c) => sum + (c.total_commission || 0), 0),
  };

  return (
    <div className="space-y-4 p-4" data-testid="commissions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hoa hồng</h1>
          <p className="text-sm text-gray-500">Quản lý hoa hồng, chính sách và duyệt chi trả</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="policy" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Chính sách
          </TabsTrigger>
          <TabsTrigger value="approve" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Duyệt
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Danh sách hoa hồng */}
        <TabsContent value="list" className="mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">Số hoa hồng</p>
                <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-100">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">Tổng giá trị HĐ</p>
                <p className="text-2xl font-bold text-gray-700">{formatCurrency(summary.totalContractValue)}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">Tổng hoa hồng</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCommission)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo mã, HĐ, dự án, khách hàng, sale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="calculated">Đã tính</SelectItem>
                <SelectItem value="split">Đã chia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có hoa hồng nào</h3>
              <p className="text-gray-500 text-sm">Hoa hồng sẽ tự động tạo khi hợp đồng được ký</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommissions.map((commission) => (
                <CommissionCard
                  key={commission.id}
                  commission={commission}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Chính sách hoa hồng */}
        <TabsContent value="policy" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Chính sách hoa hồng theo dự án
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cấu hình % hoa hồng</h3>
                <p className="text-gray-500 text-sm mb-4">Thiết lập tỷ lệ hoa hồng cho từng dự án</p>
                <a 
                  href="/finance/project-commissions"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Mở cấu hình
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Duyệt hoa hồng */}
        <TabsContent value="approve" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Duyệt chi trả hoa hồng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Phê duyệt Payout</h3>
                <p className="text-gray-500 text-sm mb-4">Dành cho kế toán duyệt chi trả nội bộ</p>
                <a 
                  href="/finance/payouts"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <CheckSquare className="w-4 h-4" />
                  Mở duyệt chi trả
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <CommissionDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        commission={selectedCommission}
      />
    </div>
  );
}
