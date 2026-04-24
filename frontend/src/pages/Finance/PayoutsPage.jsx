/**
 * Payouts Page - Quản lý Chi trả
 * Kế toán duyệt và chi trả cho Sale/Leader/Affiliate
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  Users, CheckCircle, Clock, DollarSign, 
  Search, Check, CreditCard, User
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPayouts,
  approvePayout,
  markPayoutPaid,
  batchApprovePayouts,
} from '../../api/financeApi';

const DEMO_PAYOUTS = [
  { id: 'pay-1', code: 'PAY-2026-001', commission_split_code: 'SPLIT-1001', recipient_name: 'Nguyễn Minh Quân', recipient_role: 'sale', gross_amount: 38000000, tax_amount: 3800000, net_amount: 34200000, bank_name: 'VCB', bank_account: '0123456789', status: 'pending', status_label: 'Chờ duyệt', status_color: 'yellow' },
  { id: 'pay-2', code: 'PAY-2026-002', commission_split_code: 'SPLIT-1002', recipient_name: 'Lê Mỹ An', recipient_role: 'affiliate', gross_amount: 12500000, tax_amount: 1250000, net_amount: 11250000, bank_name: 'ACB', bank_account: '9876543210', status: 'approved', status_label: 'Đã duyệt', status_color: 'blue', approved_by_name: 'Kế toán trưởng', approved_at: '2026-03-24' },
  { id: 'pay-3', code: 'PAY-2026-003', commission_split_code: 'SPLIT-1003', recipient_name: 'Trần Gia Bảo', recipient_role: 'leader', gross_amount: 18000000, tax_amount: 1800000, net_amount: 16200000, bank_name: 'TCB', bank_account: '1122334455', status: 'paid', status_label: 'Đã trả', status_color: 'green', paid_at: '2026-03-23' },
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

// Role badge
function RoleBadge({ role }) {
  const roleConfig = {
    sale: { label: 'Sale', color: 'bg-blue-100 text-blue-700' },
    leader: { label: 'Leader', color: 'bg-purple-100 text-purple-700' },
    affiliate: { label: 'Affiliate', color: 'bg-orange-100 text-orange-700' },
    company: { label: 'Công ty', color: 'bg-gray-100 text-gray-700' },
  };
  const config = roleConfig[role] || roleConfig.sale;
  
  return (
    <Badge className={`${config.color} font-medium text-xs`}>
      {config.label}
    </Badge>
  );
}

// Status badge
function StatusBadge({ status, label, color }) {
  const colorMap = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <Badge className={`${colorMap[color] || colorMap.yellow} font-medium`}>
      {label || status}
    </Badge>
  );
}

// Payout Card
function PayoutCard({ payout, selected, onSelect, onApprove, onMarkPaid }) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {payout.status === 'pending' && (
              <Checkbox
                checked={selected}
                onCheckedChange={() => onSelect(payout.id)}
              />
            )}
            <div>
              <p className="font-semibold text-sm">{payout.code}</p>
              <p className="text-xs text-gray-500">{payout.commission_split_code}</p>
            </div>
          </div>
          <StatusBadge 
            status={payout.status}
            label={payout.status_label}
            color={payout.status_color}
          />
        </div>

        {/* Recipient */}
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{payout.recipient_name}</span>
          <RoleBadge role={payout.recipient_role} />
        </div>

        {/* Amount */}
        <div className="space-y-1 mb-3 p-2 bg-gray-50 rounded">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Hoa hồng:</span>
            <span className="font-medium">{formatCurrency(payout.gross_amount)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Thuế TNCN (10%):</span>
            <span className="font-medium text-red-600">-{formatCurrency(payout.tax_amount)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-1 mt-1">
            <span className="font-medium">Thực nhận:</span>
            <span className="font-bold text-green-600">{formatCurrency(payout.net_amount)}</span>
          </div>
        </div>

        {/* Bank info */}
        {payout.bank_account && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <CreditCard className="w-3 h-3" />
            <span>{payout.bank_name}: {payout.bank_account}</span>
          </div>
        )}

        {/* Approval info */}
        {payout.approved_by_name && (
          <div className="text-xs text-gray-500 mb-3">
            Duyệt bởi: {payout.approved_by_name} ({formatDate(payout.approved_at)})
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {payout.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onApprove(payout)}
              className="flex-1"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Duyệt
            </Button>
          )}
          {payout.status === 'approved' && (
            <Button 
              size="sm"
              onClick={() => onMarkPaid(payout)}
              className="flex-1"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Đã trả
            </Button>
          )}
          {payout.status === 'paid' && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />
              Đã chi trả {formatDate(payout.paid_at)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Mark Paid Dialog
function MarkPaidDialog({ open, onClose, payout, onSubmit }) {
  const [paymentReference, setPaymentReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await onSubmit({
        payment_reference: paymentReference,
        paid_at: paidAt,
      });
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận đã chi trả</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              Chi trả cho <strong>{payout?.recipient_name}</strong>: <strong>{formatCurrency(payout?.net_amount)}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ngày chi trả</Label>
            <Input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Mã giao dịch / Chứng từ</Label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="VD: CK-123456"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Page
export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Dialog states
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getPayouts(params);
      const items = data || [];
      setPayouts(items.length > 0 ? items : DEMO_PAYOUTS.filter((item) => statusFilter === 'all' || item.status === statusFilter));
    } catch (error) {
      toast.warning('Đang hiển thị dữ liệu mẫu cho chi trả');
      setPayouts(DEMO_PAYOUTS.filter((item) => statusFilter === 'all' || item.status === statusFilter));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  function toggleSelect(id) {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }

  function selectAll() {
    const pendingIds = payouts
      .filter(p => p.status === 'pending')
      .map(p => p.id);
    setSelectedIds(pendingIds);
  }

  async function handleApprove(payout) {
    try {
      await approvePayout(payout.id);
      toast.success(`Đã duyệt ${payout.code}`);
      loadPayouts();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleBatchApprove() {
    if (selectedIds.length === 0) {
      toast.error('Chọn ít nhất 1 payout');
      return;
    }
    
    try {
      const result = await batchApprovePayouts(selectedIds);
      toast.success(`Đã duyệt ${result.approved_count} payout`);
      setSelectedIds([]);
      loadPayouts();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleMarkPaid(payout) {
    setSelectedPayout(payout);
    setMarkPaidDialogOpen(true);
  }

  async function submitMarkPaid(data) {
    await markPayoutPaid(selectedPayout.id, data);
    toast.success('Đã xác nhận chi trả');
    loadPayouts();
  }

  // Filter
  const filteredPayouts = payouts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.code?.toLowerCase().includes(q) ||
      p.recipient_name?.toLowerCase().includes(q)
    );
  });

  // Summary
  const summary = {
    total: filteredPayouts.length,
    pending: filteredPayouts.filter(p => p.status === 'pending').length,
    approved: filteredPayouts.filter(p => p.status === 'approved').length,
    paid: filteredPayouts.filter(p => p.status === 'paid').length,
    totalNet: filteredPayouts.reduce((sum, p) => sum + (p.net_amount || 0), 0),
    totalTax: filteredPayouts.reduce((sum, p) => sum + (p.tax_amount || 0), 0),
  };

  const pendingCount = payouts.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-4 p-4" data-testid="payouts-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chi trả nội bộ</h1>
          <p className="text-sm text-gray-500">Duyệt và chi trả hoa hồng cho Sale/Leader/Affiliate</p>
        </div>
        
        {selectedIds.length > 0 && (
          <Button onClick={handleBatchApprove}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Duyệt ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-yellow-50 border-yellow-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Chờ duyệt</p>
            <p className="text-lg font-bold text-yellow-600">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Đã duyệt</p>
            <p className="text-lg font-bold text-blue-600">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Đã trả</p>
            <p className="text-lg font-bold text-green-600">{summary.paid}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Thuế TNCN thu</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalTax)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã, người nhận..."
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
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="paid">Đã trả</SelectItem>
          </SelectContent>
        </Select>
        
        {pendingCount > 0 && (
          <Button variant="outline" onClick={selectAll}>
            Chọn tất cả ({pendingCount})
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chưa có payout nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayouts.map((payout) => (
            <PayoutCard
              key={payout.id}
              payout={payout}
              selected={selectedIds.includes(payout.id)}
              onSelect={toggleSelect}
              onApprove={handleApprove}
              onMarkPaid={handleMarkPaid}
            />
          ))}
        </div>
      )}

      {/* Mark Paid Dialog */}
      <MarkPaidDialog
        open={markPaidDialogOpen}
        onClose={() => setMarkPaidDialogOpen(false)}
        payout={selectedPayout}
        onSubmit={submitMarkPaid}
      />
    </div>
  );
}
