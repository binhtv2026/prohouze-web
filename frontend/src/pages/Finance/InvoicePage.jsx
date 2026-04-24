import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  FileText,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Eye,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

const invoiceTypeLabels = {
  sales: 'Hoá đơn bán hàng',
  service: 'Hoá đơn dịch vụ',
  vat: 'Hoá đơn GTGT',
  receipt: 'Phiếu thu',
  payment: 'Phiếu chi',
};

const statusLabels = {
  draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
  issued: { label: 'Đã phát hành', color: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Đã gửi', color: 'bg-purple-100 text-purple-700' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Đã huỷ', color: 'bg-gray-100 text-gray-700' },
};

const DEMO_INVOICES = [
  { id: 'inv-1', invoice_no: 'HD-2026-001', invoice_type: 'service', customer_name: 'Nguyễn Minh Tâm', total_amount: 128000000, issue_date: '2026-03-20', due_date: '2026-03-30', status: 'sent' },
  { id: 'inv-2', invoice_no: 'HD-2026-002', invoice_type: 'vat', customer_name: 'Công ty Event House', total_amount: 85000000, issue_date: '2026-03-18', due_date: '2026-03-25', status: 'paid' },
  { id: 'inv-3', invoice_no: 'HD-2026-003', invoice_type: 'sales', customer_name: 'Lê Mỹ An', total_amount: 350000000, issue_date: '2026-03-21', due_date: '2026-03-28', status: 'issued' },
];

const DEMO_INVOICE_DETAIL = {
  id: 'inv-demo',
  invoice_no: 'HD-2026-001',
  invoice_type: 'service',
  customer_name: 'Nguyễn Minh Tâm',
  customer_address: 'Quận 2, TP.HCM',
  customer_tax_code: '0312345678',
  total_amount: 128000000,
  subtotal: 116363636,
  total_vat: 11636364,
  issue_date: '2026-03-20',
  due_date: '2026-03-30',
  status: 'sent',
  items: [
    { description: 'Phí giữ chỗ căn A2-1208', quantity: 1, unit: 'gói', unit_price: 116363636, vat_rate: 10, total: 128000000 },
  ],
};

export default function InvoicePage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({
    invoice_type: 'all',
    status: 'all',
  });

  const [formData, setFormData] = useState({
    invoice_type: 'service',
    customer_name: '',
    customer_address: '',
    customer_tax_code: '',
    customer_phone: '',
    customer_email: '',
    items: [{ description: '', quantity: 1, unit: 'item', unit_price: 0, vat_rate: 10 }],
    payment_method: 'transfer',
    payment_terms: 'Thanh toán trong 30 ngày',
    due_date: '',
    notes: '',
  });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.invoice_type && filters.invoice_type !== 'all') params.append('invoice_type', filters.invoice_type);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const res = await api.get(`/finance/invoices?${params.toString()}`);
      const items = res.data || [];
      setInvoices(items.length > 0 ? items : DEMO_INVOICES.filter((item) => {
        const matchType = filters.invoice_type === 'all' || item.invoice_type === filters.invoice_type;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        return matchType && matchStatus;
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho hoá đơn');
      setInvoices(DEMO_INVOICES.filter((item) => {
        const matchType = filters.invoice_type === 'all' || item.invoice_type === filters.invoice_type;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        return matchType && matchStatus;
      }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const calculateItemTotal = (item) => {
    const amount = item.quantity * item.unit_price;
    const vatAmount = amount * item.vat_rate / 100;
    return { amount, vatAmount, total: amount + vatAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const items = formData.items.map(item => {
        const calc = calculateItemTotal(item);
        return {
          ...item,
          amount: calc.amount,
          vat_amount: calc.vatAmount,
          total: calc.total,
        };
      });

      const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
      const totalVat = items.reduce((sum, i) => sum + i.vat_amount, 0);
      const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

      await api.post('/finance/invoices', {
        ...formData,
        items,
        subtotal,
        total_discount: 0,
        total_vat: totalVat,
        total_amount: totalAmount,
      });
      toast.success('Đã tạo hoá đơn');
      setShowDialog(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Không thể tạo hoá đơn');
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_type: 'service',
      customer_name: '',
      customer_address: '',
      customer_tax_code: '',
      customer_phone: '',
      customer_email: '',
      items: [{ description: '', quantity: 1, unit: 'item', unit_price: 0, vat_rate: 10 }],
      payment_method: 'transfer',
      payment_terms: 'Thanh toán trong 30 ngày',
      due_date: '',
      notes: '',
    });
  };

  const handleIssue = async (invoiceId) => {
    try {
      await api.put(`/finance/invoices/${invoiceId}/issue`);
      toast.success('Đã phát hành hoá đơn');
      fetchInvoices();
    } catch (error) {
      console.error('Error issuing invoice:', error);
      toast.error('Không thể phát hành hoá đơn');
    }
  };

  const handleViewDetail = async (invoiceId) => {
    try {
      const res = await api.get(`/finance/invoices/${invoiceId}`);
      setSelectedInvoice(res.data || DEMO_INVOICE_DETAIL);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho chi tiết hoá đơn');
      setSelectedInvoice({ ...DEMO_INVOICE_DETAIL, id: invoiceId });
      setShowDetailDialog(true);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit: 'item', unit_price: 0, vat_rate: 10 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  return (
    <div className="space-y-6" data-testid="invoice-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Hoá đơn</h1>
          <p className="text-slate-500 text-sm mt-1">Tạo và quản lý hoá đơn, phiếu thu chi</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-invoice-btn">
              <Plus className="h-4 w-4 mr-2" />
              Tạo hoá đơn
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Hoá đơn mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại hoá đơn</Label>
                  <Select value={formData.invoice_type} onValueChange={(v) => setFormData({ ...formData, invoice_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(invoiceTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hạn thanh toán</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Thông tin khách hàng</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tên khách hàng</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Mã số thuế</Label>
                    <Input
                      value={formData.customer_tax_code}
                      onChange={(e) => setFormData({ ...formData, customer_tax_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Điện thoại</Label>
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Địa chỉ</Label>
                    <Input
                      value={formData.customer_address}
                      onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Chi tiết hoá đơn</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm mục
                  </Button>
                </div>
                {formData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                    <div className="col-span-2">
                      <Label>Mô tả</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Mô tả dịch vụ/sản phẩm"
                        required
                      />
                    </div>
                    <div>
                      <Label>SL</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Đơn giá</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>VAT %</Label>
                      <Input
                        type="number"
                        value={item.vat_rate}
                        onChange={(e) => updateItem(idx, 'vat_rate', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(idx)}
                        disabled={formData.items.length === 1}
                      >
                        Xoá
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">Tạo hoá đơn</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Label className="mb-2 block">Loại hoá đơn</Label>
              <Select value={filters.invoice_type} onValueChange={(v) => setFilters({ ...filters, invoice_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(invoiceTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label className="mb-2 block">Trạng thái</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(statusLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setFilters({ invoice_type: 'all', status: 'all' })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Hoá đơn</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có hoá đơn nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{inv.invoice_no}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusLabels[inv.status]?.color || 'bg-slate-100'}`}>
                          {statusLabels[inv.status]?.label || inv.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{inv.customer_name}</span>
                        <span>•</span>
                        <Badge variant="outline">{invoiceTypeLabels[inv.invoice_type] || inv.invoice_type}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(inv.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-800">{formatCurrency(inv.total_amount)}</p>
                      {inv.remaining_amount > 0 && (
                        <p className="text-xs text-orange-600">Còn nợ: {formatCurrency(inv.remaining_amount)}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetail(inv.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {inv.status === 'draft' && (
                        <Button size="sm" onClick={() => handleIssue(inv.id)}>
                          <Send className="h-4 w-4 mr-1" />
                          Phát hành
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Hoá đơn {selectedInvoice?.invoice_no}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Khách hàng</p>
                  <p className="font-medium">{selectedInvoice.customer_name}</p>
                  {selectedInvoice.customer_address && <p className="text-sm">{selectedInvoice.customer_address}</p>}
                  {selectedInvoice.customer_tax_code && <p className="text-sm">MST: {selectedInvoice.customer_tax_code}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Trạng thái</p>
                  <span className={`px-2 py-1 rounded-full text-sm ${statusLabels[selectedInvoice.status]?.color}`}>
                    {statusLabels[selectedInvoice.status]?.label}
                  </span>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Mô tả</th>
                      <th className="px-4 py-2 text-right">SL</th>
                      <th className="px-4 py-2 text-right">Đơn giá</th>
                      <th className="px-4 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tổng tiền hàng:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VAT:</span>
                    <span>{formatCurrency(selectedInvoice.total_vat)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                  <p className="text-sm italic text-slate-500">{selectedInvoice.total_amount_words}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
