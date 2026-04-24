/**
 * Hard Booking Management Page - Prompt 8/20
 * Allocated units and reservation management
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hardBookingApi, salesConfigApi } from '@/lib/salesApi';
import { 
  Search,
  Building,
  DollarSign,
  Calendar,
  CheckCircle,
  FileText,
  CreditCard,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_HARD_BOOKINGS = [
  {
    id: 'hard-booking-1',
    contact_name: 'Nguyễn Hữu Đạt',
    code: 'HB-001',
    status: 'deposit_pending',
    product_code: 'A2-1208',
    project_name: 'The Privé Residence',
    unit_base_price: 4300000000,
    listed_price: 4250000000,
    total_discount: 50000000,
    final_price: 4200000000,
    deposit_amount: 100000000,
    deposit_paid: 0,
    payment_plan_name: 'Thanh toán chuẩn 12 đợt',
  },
  {
    id: 'hard-booking-2',
    contact_name: 'Lê Ngọc Bích',
    code: 'HB-002',
    status: 'deposited',
    product_code: 'B1-0910',
    project_name: 'Masteri Lumière',
    unit_base_price: 2950000000,
    listed_price: 2900000000,
    total_discount: 30000000,
    final_price: 2870000000,
    deposit_amount: 50000000,
    deposit_paid: 50000000,
    payment_plan_name: 'Thanh toán ưu đãi 8 đợt',
  },
  {
    id: 'hard-booking-3',
    contact_name: 'Trần Nhật Minh',
    code: 'HB-003',
    status: 'contracted',
    product_code: 'GH-1205',
    project_name: 'Glory Heights',
    unit_base_price: 3780000000,
    listed_price: 3720000000,
    total_discount: 40000000,
    final_price: 3680000000,
    deposit_amount: 100000000,
    deposit_paid: 100000000,
    payment_plan_name: 'Thanh toán 24 tháng',
    contract_id: 'HD-003',
  },
];

export default function HardBookingPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [statusConfig, setStatusConfig] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsData, statusData] = await Promise.all([
        hardBookingApi.getHardBookings({ limit: 100 }),
        salesConfigApi.getHardBookingStatuses(),
      ]);
      
      const bookingItems = Array.isArray(bookingsData) ? bookingsData : bookingsData?.data || [];
      setBookings(bookingItems.length > 0 ? bookingItems : DEMO_HARD_BOOKINGS);
      setStatusConfig(statusData.statuses || {});
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.warning('Đang hiển thị dữ liệu mẫu cho hard booking');
      setBookings(DEMO_HARD_BOOKINGS);
      setStatusConfig({
        active: { label: 'Đang hoạt động', color: 'bg-blue-100 text-blue-700' },
        deposit_pending: { label: 'Chờ cọc', color: 'bg-amber-100 text-amber-700' },
        deposit_partial: { label: 'Cọc một phần', color: 'bg-orange-100 text-orange-700' },
        deposited: { label: 'Đã cọc', color: 'bg-emerald-100 text-emerald-700' },
        contracted: { label: 'Đã ký HĐ', color: 'bg-violet-100 text-violet-700' },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value) => {
    if (!value) return '0';
    return value.toLocaleString('vi-VN');
  };

  const handleRecordDeposit = async () => {
    if (!selectedBooking || !depositAmount) return;
    
    try {
      await hardBookingApi.recordDeposit(selectedBooking.id, {
        amount: parseFloat(depositAmount),
        payment_method: 'transfer',
      });
      toast.success('Đã ghi nhận cọc');
      setShowDepositModal(false);
      setDepositAmount('');
      loadData();
    } catch (err) {
      toast.error('Không thể ghi nhận cọc');
    }
  };

  const handleConvertToContract = async (bookingId) => {
    try {
      const result = await hardBookingApi.convertToContract(bookingId);
      toast.success(`Đã tạo hợp đồng ${result.contract_code}`);
      loadData();
    } catch (err) {
      toast.error('Không thể tạo hợp đồng');
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || {};
    return (
      <Badge className={config.color || 'bg-gray-100'} variant="secondary">
        {config.label || status}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    if (search) {
      const s = search.toLowerCase();
      const match = 
        booking.contact_name?.toLowerCase().includes(s) ||
        booking.code?.toLowerCase().includes(s) ||
        booking.product_code?.toLowerCase().includes(s);
      if (!match) return false;
    }
    
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="hard-booking-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hard Bookings</h1>
          <p className="text-gray-500">Quản lý booking đã phân bổ</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm booking..."
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="deposit_pending">Chờ cọc</SelectItem>
              <SelectItem value="deposit_partial">Cọc một phần</SelectItem>
              <SelectItem value="deposited">Đã cọc</SelectItem>
              <SelectItem value="contracted">Đã ký HĐ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ cọc</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => ['active', 'deposit_pending'].includes(b.status)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã cọc đủ</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'deposited').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã ký HĐ</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'contracted').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBookings.map((booking) => (
          <Card 
            key={booking.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedBooking(booking);
              setShowDetailModal(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{booking.contact_name}</p>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-sm text-gray-500">{booking.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(booking.final_price)} đ
                  </p>
                  <p className="text-xs text-gray-500">Giá cuối</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{booking.product_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>
                    Cọc: {formatCurrency(booking.deposit_paid)}/{formatCurrency(booking.deposit_amount)}
                  </span>
                </div>
              </div>

              {/* Deposit progress */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Tiến độ cọc</span>
                  <span>{Math.round((booking.deposit_paid / booking.deposit_amount) * 100) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (booking.deposit_paid / booking.deposit_amount) * 100) || 0}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                {['active', 'deposit_pending', 'deposit_partial'].includes(booking.status) && (
                  <Button size="sm" variant="outline" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBooking(booking);
                    setShowDepositModal(true);
                  }}>
                    <CreditCard className="h-4 w-4 mr-1" />
                    Ghi nhận cọc
                  </Button>
                )}
                {booking.status === 'deposited' && !booking.contract_id && (
                  <Button size="sm" onClick={(e) => {
                    e.stopPropagation();
                    handleConvertToContract(booking.id);
                  }}>
                    <FileText className="h-4 w-4 mr-1" />
                    Tạo hợp đồng
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có hard booking nào</p>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết Hard Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedBooking.contact_name}</h3>
                  <p className="text-sm text-gray-500">{selectedBooking.code}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Căn hộ</p>
                  <p className="font-medium">{selectedBooking.product_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dự án</p>
                  <p className="font-medium">{selectedBooking.project_name || 'N/A'}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá gốc:</span>
                  <span>{formatCurrency(selectedBooking.unit_base_price)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá niêm yết:</span>
                  <span>{formatCurrency(selectedBooking.listed_price)} đ</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Tổng chiết khấu:</span>
                  <span>-{formatCurrency(selectedBooking.total_discount)} đ</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Giá cuối:</span>
                  <span className="text-green-600">{formatCurrency(selectedBooking.final_price)} đ</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tiền cọc</p>
                  <p className="font-medium">{formatCurrency(selectedBooking.deposit_amount)} đ</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đã nộp</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedBooking.deposit_paid)} đ</p>
                </div>
              </div>

              {selectedBooking.payment_plan_name && (
                <div>
                  <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                  <p className="font-medium">{selectedBooking.payment_plan_name}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận cọc</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Booking</p>
                <p className="font-medium">{selectedBooking.code} - {selectedBooking.contact_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cần cọc</p>
                <p className="font-medium">{formatCurrency(selectedBooking.deposit_amount - selectedBooking.deposit_paid)} đ còn lại</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Số tiền nộp</label>
                <Input
                  type="number"
                  placeholder="Nhập số tiền"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositModal(false)}>Hủy</Button>
            <Button onClick={handleRecordDeposit} disabled={!depositAmount}>Ghi nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
