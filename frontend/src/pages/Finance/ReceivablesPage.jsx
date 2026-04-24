/**
 * Receivables Page - Quản lý Công nợ Chủ đầu tư
 * Kế toán xác nhận tiền về, theo dõi công nợ
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
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
  CreditCard, CheckCircle, AlertTriangle, Clock, 
  DollarSign, Building, Search, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getReceivables,
  confirmReceivable,
  recordReceivablePayment,
} from '../../api/financeApi';

const DEMO_RECEIVABLES = [
  {
    id: 'recv-001',
    code: 'PT-001',
    contract_code: 'HD-2026-001',
    developer_name: 'Chu dau tu Horizon Land',
    amount_due: 850000000,
    amount_paid: 650000000,
    amount_remaining: 200000000,
    due_date: new Date().toISOString(),
    days_overdue: 0,
    status: 'confirmed',
    status_label: 'Đã xác nhận',
    status_color: 'blue',
  },
  {
    id: 'recv-002',
    code: 'PT-002',
    contract_code: 'HD-2026-002',
    developer_name: 'Chu dau tu Central Avenue',
    amount_due: 1200000000,
    amount_paid: 0,
    amount_remaining: 1200000000,
    due_date: new Date().toISOString(),
    days_overdue: 3,
    status: 'pending',
    status_label: 'Chờ xác nhận',
    status_color: 'yellow',
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

// Status badge component
function StatusBadge({ status, label, color }) {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <Badge className={`${colorMap[color] || colorMap.gray} font-medium`}>
      {label || status}
    </Badge>
  );
}

// Receivable Card Component
function ReceivableCard({ receivable, onConfirm, onRecordPayment }) {
  const progressPercent = receivable.amount_due > 0 
    ? (receivable.amount_paid / receivable.amount_due) * 100 
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-sm">{receivable.code}</p>
            <p className="text-xs text-gray-500">HĐ: {receivable.contract_code}</p>
          </div>
          <StatusBadge 
            status={receivable.status}
            label={receivable.status_label}
            color={receivable.status_color}
          />
        </div>

        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <Building className="w-4 h-4" />
          <span>{receivable.developer_name || 'Chưa có CĐT'}</span>
        </div>

        {/* Amount Info */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phải thu:</span>
            <span className="font-semibold">{formatCurrency(receivable.amount_due)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Đã thu:</span>
            <span className="font-semibold text-green-600">{formatCurrency(receivable.amount_paid)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Còn lại:</span>
            <span className="font-semibold text-blue-600">{formatCurrency(receivable.amount_remaining)}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Due date & Overdue */}
        {receivable.due_date && (
          <div className="flex items-center gap-1 text-xs mb-3">
            <Clock className="w-3 h-3" />
            <span>Hạn: {formatDate(receivable.due_date)}</span>
            {receivable.days_overdue > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Quá hạn {receivable.days_overdue} ngày
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {receivable.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onConfirm(receivable)}
              className="flex-1"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Xác nhận
            </Button>
          )}
          {['confirmed', 'partial'].includes(receivable.status) && (
            <Button 
              size="sm"
              onClick={() => onRecordPayment(receivable)}
              className="flex-1"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Ghi nhận tiền về
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Record Payment Dialog
function RecordPaymentDialog({ open, onClose, receivable, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (receivable) {
      setAmount(receivable.amount_remaining?.toString() || '');
    }
  }, [receivable]);

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_reference: paymentReference,
        notes,
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
          <DialogTitle>Ghi nhận thanh toán từ CĐT</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>{receivable?.code}</strong> - Còn phải thu: <strong>{formatCurrency(receivable?.amount_remaining)}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Số tiền nhận</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số tiền"
            />
          </div>

          <div className="space-y-2">
            <Label>Ngày thanh toán</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Mã giao dịch (UNC/Chứng từ)</Label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="VD: UNC-123456"
            />
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm"
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
export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState(null);

  const loadReceivables = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getReceivables(params);
      const receivableItems = Array.isArray(data) ? data : [];
      setReceivables(receivableItems.length > 0 ? receivableItems : DEMO_RECEIVABLES);
    } catch (error) {
      setReceivables(DEMO_RECEIVABLES);
      toast.error('Lỗi tải dữ liệu, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReceivables();
  }, [loadReceivables]);

  async function handleConfirm(receivable) {
    try {
      await confirmReceivable(receivable.id);
      toast.success('Đã xác nhận công nợ');
      loadReceivables();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleRecordPayment(receivable) {
    setSelectedReceivable(receivable);
    setPaymentDialogOpen(true);
  }

  async function submitPayment(data) {
    await recordReceivablePayment(selectedReceivable.id, data);
    toast.success('Đã ghi nhận thanh toán');
    loadReceivables();
  }

  // Filter by search
  const filteredReceivables = receivables.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.code?.toLowerCase().includes(q) ||
      r.contract_code?.toLowerCase().includes(q) ||
      r.developer_name?.toLowerCase().includes(q)
    );
  });

  // Summary
  const summary = {
    total: filteredReceivables.length,
    totalDue: filteredReceivables.reduce((sum, r) => sum + (r.amount_due || 0), 0),
    totalPaid: filteredReceivables.reduce((sum, r) => sum + (r.amount_paid || 0), 0),
    totalRemaining: filteredReceivables.reduce((sum, r) => sum + (r.amount_remaining || 0), 0),
  };

  return (
    <div className="space-y-4 p-4" data-testid="receivables-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Công nợ phải thu</h1>
          <p className="text-sm text-gray-500">Theo dõi công nợ từ Chủ đầu tư</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Tổng phải thu</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalDue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Đã thu</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Còn lại</p>
            <p className="text-lg font-bold text-yellow-600">{formatCurrency(summary.totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-100">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500">Số công nợ</p>
            <p className="text-lg font-bold text-gray-600">{summary.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã, HĐ, CĐT..."
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
            <SelectItem value="partial">Thanh toán một phần</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="overdue">Quá hạn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredReceivables.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chưa có công nợ nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReceivables.map((receivable) => (
            <ReceivableCard
              key={receivable.id}
              receivable={receivable}
              onConfirm={handleConfirm}
              onRecordPayment={handleRecordPayment}
            />
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        receivable={selectedReceivable}
        onSubmit={submitPayment}
      />
    </div>
  );
}
