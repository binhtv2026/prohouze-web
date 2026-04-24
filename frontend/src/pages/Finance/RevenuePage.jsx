import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const categoryLabels = {
  property_sale: 'Bán BĐS',
  brokerage_fee: 'Phí môi giới',
  consulting_fee: 'Phí tư vấn',
  service_fee: 'Phí dịch vụ',
  rental_income: 'Thu từ cho thuê',
  other: 'Khác',
};

const DEMO_REVENUES = [
  { id: 'rev-1', category: 'brokerage_fee', amount: 285000000, description: 'Phí môi giới giao dịch The Privé', transaction_date: '2026-03-22', payment_method: 'transfer', reference_no: 'REF-001' },
  { id: 'rev-2', category: 'property_sale', amount: 965000000, description: 'Doanh thu booking và chốt căn tháng 3', transaction_date: '2026-03-24', payment_method: 'transfer', reference_no: 'REF-002' },
  { id: 'rev-3', category: 'consulting_fee', amount: 42000000, description: 'Phí tư vấn hồ sơ đầu tư', transaction_date: '2026-03-25', payment_method: 'cash', reference_no: 'REF-003' },
];

const DEMO_REVENUE_SUMMARY = {
  total_revenue: 1292000000,
  total_transactions: 18,
  average_transaction: 71777778,
  by_category: {
    property_sale: 965000000,
    brokerage_fee: 285000000,
    consulting_fee: 42000000,
  },
};

export default function RevenuePage() {
  const { token } = useAuth();
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    from_date: '',
    to_date: '',
  });

  const [formData, setFormData] = useState({
    category: 'brokerage_fee',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    reference_no: '',
    notes: '',
  });

  const fetchRevenues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);

      const res = await api.get(`/finance/revenues?${params.toString()}`);
      const items = res.data || [];
      setRevenues(items.length > 0 ? items : DEMO_REVENUES.filter((item) => {
        const matchCategory = filters.category === 'all' || item.category === filters.category;
        return matchCategory;
      }));
    } catch (error) {
      console.error('Error fetching revenues:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho doanh thu');
      setRevenues(DEMO_REVENUES.filter((item) => {
        const matchCategory = filters.category === 'all' || item.category === filters.category;
        return matchCategory;
      }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSummary = useCallback(async () => {
    try {
      const now = new Date();
      const res = await api.get(`/finance/revenues/summary?period_year=${now.getFullYear()}&period_month=${now.getMonth() + 1}`);
      setSummary(res.data || DEMO_REVENUE_SUMMARY);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary(DEMO_REVENUE_SUMMARY);
    }
  }, []);

  useEffect(() => {
    fetchRevenues();
    fetchSummary();
  }, [fetchRevenues, fetchSummary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/revenues', formData);
      toast.success('Đã thêm doanh thu');
      setShowDialog(false);
      setFormData({
        category: 'brokerage_fee',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'transfer',
        reference_no: '',
        notes: '',
      });
      fetchRevenues();
      fetchSummary();
    } catch (error) {
      console.error('Error creating revenue:', error);
      toast.error('Không thể thêm doanh thu');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  return (
    <div className="space-y-6" data-testid="revenue-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Doanh thu</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi và ghi nhận các nguồn doanh thu</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-revenue-btn">
              <Plus className="h-4 w-4 mr-2" />
              Thêm doanh thu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Doanh thu mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Danh mục</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số tiền (VNĐ)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả giao dịch"
                  required
                />
              </div>
              <div>
                <Label>Ngày giao dịch</Label>
                <Input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phương thức thanh toán</Label>
                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="transfer">Chuyển khoản</SelectItem>
                    <SelectItem value="card">Thẻ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số chứng từ</Label>
                <Input
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  placeholder="Mã giao dịch/Số biên lai"
                />
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">Thêm</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Doanh thu tháng này</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(summary?.total_revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Số giao dịch</p>
                <p className="text-2xl font-bold text-slate-800">{summary?.transaction_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Danh mục</p>
                <p className="text-2xl font-bold text-slate-800">{Object.keys(summary?.by_category || {}).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Label className="mb-2 block">Danh mục</Label>
              <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="mb-2 block">Từ ngày</Label>
              <Input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
              />
            </div>
            <div className="w-40">
              <Label className="mb-2 block">Đến ngày</Label>
              <Input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
              />
            </div>
            <Button variant="outline" onClick={() => setFilters({ category: 'all', from_date: '', to_date: '' })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : revenues.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có doanh thu nào</p>
              <p className="text-sm mt-1">Bấm "Thêm doanh thu" để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenues.map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{rev.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Badge variant="outline">{categoryLabels[rev.category] || rev.category}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(rev.transaction_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-600">{formatCurrency(rev.amount)}</p>
                    {rev.reference_no && (
                      <p className="text-xs text-slate-500">Ref: {rev.reference_no}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
