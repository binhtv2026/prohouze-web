import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  User,
  Calendar,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  deposited: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const DEMO_BOOKINGS = [
  {
    id: 'booking-1',
    customer_name: 'Nguyễn Khánh Linh',
    product_name: 'A2-1208 - 2PN view sông',
    product_code: 'A2-1208',
    status: 'pending',
    created_at: '2026-03-25T08:30:00Z',
    price: 4250000000,
    deposit_amount: 100000000,
  },
  {
    id: 'booking-2',
    customer_name: 'Trần Hoàng Nam',
    product_name: 'B1-0910 - 1PN+',
    product_code: 'B1-0910',
    status: 'confirmed',
    created_at: '2026-03-24T10:00:00Z',
    price: 2890000000,
    deposit_amount: 50000000,
  },
  {
    id: 'booking-3',
    customer_name: 'Lê Thị Mai',
    product_name: 'GH-1205 - 2PN chuẩn',
    product_code: 'GH-1205',
    status: 'deposited',
    created_at: '2026-03-23T14:20:00Z',
    price: 3680000000,
    deposit_amount: 100000000,
  },
];

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/sales/bookings';
      if (statusFilter !== 'all') url += `?status=${statusFilter}`;
      const res = await api.get(url);
      const items = res.data || [];
      setBookings(items.length > 0 ? items : DEMO_BOOKINGS.filter((item) => statusFilter === 'all' || item.status === statusFilter));
    } catch (error) {
      console.error('Error:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho booking');
      setBookings(DEMO_BOOKINGS.filter((item) => statusFilter === 'all' || item.status === statusFilter));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/sales/bookings/${id}`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công!');
      fetchBookings();
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const filteredBookings = bookings.filter(b =>
    b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.product_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="bookings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Booking</h1>
          <p className="text-slate-500 text-sm mt-1">Đặt chỗ và giỏ hàng</p>
        </div>
        <Button data-testid="add-booking-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo Booking
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo KH, mã SP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ xác nhận</SelectItem>
            <SelectItem value="confirmed">Đã xác nhận</SelectItem>
            <SelectItem value="deposited">Đã cọc</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Chờ xác nhận</p>
                <p className="text-xl font-bold text-amber-700">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Đã xác nhận</p>
                <p className="text-xl font-bold text-blue-700">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Đã cọc</p>
                <p className="text-xl font-bold text-green-700">
                  {bookings.filter(b => b.status === 'deposited').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-600">Tổng booking</p>
                <p className="text-xl font-bold text-slate-700">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Chưa có booking nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`booking-${booking.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{booking.product_name || booking.product_code}</p>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status === 'pending' ? 'Chờ XN' :
                           booking.status === 'confirmed' ? 'Đã XN' :
                           booking.status === 'deposited' ? 'Đã cọc' : 'Đã hủy'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {booking.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {booking.created_at && new Date(booking.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(booking.price || 0)}</p>
                      {booking.deposit_amount > 0 && (
                        <p className="text-xs text-slate-500">Cọc: {formatCurrency(booking.deposit_amount)}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Xác nhận
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(booking.id, 'deposited')}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Ghi nhận cọc
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
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
