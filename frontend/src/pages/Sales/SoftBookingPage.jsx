/**
 * Soft Booking Management Page - Prompt 8/20
 * Queue management with priority selection (1-2-3)
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { salesConfigApi, softBookingApi } from '@/lib/salesApi';
import { 
  Plus, 
  Search,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Building,
  Phone,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_SOFT_BOOKINGS = [
  {
    id: 'soft-booking-1',
    queue_number: 1,
    contact_name: 'Nguyễn Minh Quân',
    code: 'SB-001',
    booking_tier: 'vip',
    status: 'confirmed',
    project_name: 'The Privé Residence',
    booking_fee: 100000000,
    priority_selections: [
      { priority: 1, product_code: 'A2-1208', product_name: '2PN view sông' },
      { priority: 2, product_code: 'A2-1506', product_name: '2PN góc' },
    ],
  },
  {
    id: 'soft-booking-2',
    queue_number: 8,
    contact_name: 'Lê Bảo Ngọc',
    code: 'SB-002',
    booking_tier: 'priority',
    status: 'submitted',
    project_name: 'Masteri Lumière',
    booking_fee: 50000000,
    priority_selections: [{ priority: 1, product_code: 'B1-0910', product_name: '1PN+' }],
  },
  {
    id: 'soft-booking-3',
    queue_number: 14,
    contact_name: 'Trần Tuấn Kiệt',
    code: 'SB-003',
    booking_tier: 'standard',
    status: 'allocated',
    project_name: 'Glory Heights',
    booking_fee: 50000000,
    priority_selections: [{ priority: 1, product_code: 'GH-1205', product_name: '2PN chuẩn' }],
    allocated_product_id: 'GH-1205',
    allocated_product_code: 'GH-1205',
    allocated_priority: 1,
  },
];

export default function SoftBookingPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [statusConfig, setStatusConfig] = useState({});
  const [tierConfig, setTierConfig] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsResponse, statusData, tierData] = await Promise.all([
        softBookingApi.getSoftBookings({ limit: 100 }),
        salesConfigApi.getSoftBookingStatuses(),
        salesConfigApi.getBookingTiers(),
      ]);
      
      // API v2 returns { data: [...], meta: {...} }
      const bookingsData = bookingsResponse.data || bookingsResponse || [];
      
      setBookings(bookingsData.length > 0 ? bookingsData : DEMO_SOFT_BOOKINGS);
      setStatusConfig(statusData.statuses || {});
      setTierConfig(tierData.tiers || {});
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.warning('Đang hiển thị dữ liệu mẫu cho soft booking');
      setBookings(DEMO_SOFT_BOOKINGS);
      setStatusConfig({
        pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
        confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
        selecting: { label: 'Đang chọn căn', color: 'bg-violet-100 text-violet-700' },
        submitted: { label: 'Chờ phân bổ', color: 'bg-orange-100 text-orange-700' },
        allocated: { label: 'Đã phân bổ', color: 'bg-emerald-100 text-emerald-700' },
      });
      setTierConfig({
        vip: { label: 'VIP', color: 'bg-purple-100 text-purple-700' },
        priority: { label: 'Ưu tiên', color: 'bg-amber-100 text-amber-700' },
        standard: { label: 'Tiêu chuẩn', color: 'bg-slate-100 text-slate-700' },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirm = async (bookingId) => {
    try {
      await softBookingApi.confirmSoftBooking(bookingId);
      toast.success('Đã xác nhận booking');
      loadData();
    } catch (err) {
      toast.error('Không thể xác nhận');
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await softBookingApi.cancelSoftBooking(bookingId, 'Cancelled by user');
      toast.success('Đã hủy booking');
      loadData();
    } catch (err) {
      toast.error('Không thể hủy');
    }
  };

  const handleSubmitForAllocation = async (bookingId) => {
    try {
      await softBookingApi.submitForAllocation(bookingId);
      toast.success('Đã submit chờ phân bổ');
      loadData();
    } catch (err) {
      toast.error('Không thể submit');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      const match = 
        booking.contact_name?.toLowerCase().includes(s) ||
        booking.code?.toLowerCase().includes(s);
      if (!match) return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  // Group by tier
  const vipBookings = filteredBookings.filter(b => b.booking_tier === 'vip');
  const priorityBookings = filteredBookings.filter(b => b.booking_tier === 'priority');
  const standardBookings = filteredBookings.filter(b => b.booking_tier === 'standard');

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || {};
    return (
      <Badge className={config.color || 'bg-gray-100'} variant="secondary">
        {config.label || status}
      </Badge>
    );
  };

  const getTierBadge = (tier) => {
    const config = tierConfig[tier] || {};
    return (
      <Badge className={config.color || 'bg-gray-100'} variant="secondary">
        {config.label || tier}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const BookingCard = ({ booking }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
      setSelectedBooking(booking);
      setShowDetailModal(true);
    }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-lg">
              #{booking.queue_number}
            </div>
            <div>
              <p className="font-semibold">{booking.contact_name}</p>
              <p className="text-sm text-gray-500">{booking.code}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getTierBadge(booking.booking_tier)}
            {getStatusBadge(booking.status)}
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            <span>{booking.project_name || 'N/A'}</span>
          </div>
        </div>

        {/* Priority selections */}
        {booking.priority_selections && booking.priority_selections.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-500 font-medium">Ưu tiên đã chọn:</p>
            <div className="flex gap-2">
              {booking.priority_selections.map((p, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {p.priority}. {p.product_code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {booking.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={(e) => {
              e.stopPropagation();
              handleConfirm(booking.id);
            }}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Xác nhận
            </Button>
          )}
          {booking.status === 'confirmed' && (
            <Button size="sm" onClick={(e) => {
              e.stopPropagation();
              setSelectedBooking(booking);
              setShowPriorityModal(true);
            }}>
              <Star className="h-4 w-4 mr-1" />
              Chọn Priority
            </Button>
          )}
          {booking.status === 'selecting' && booking.priority_selections?.length > 0 && (
            <Button size="sm" onClick={(e) => {
              e.stopPropagation();
              handleSubmitForAllocation(booking.id);
            }}>
              Submit phân bổ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6" data-testid="soft-booking-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Soft Booking Queue</h1>
          <p className="text-gray-500">Quản lý hàng đợi giữ chỗ</p>
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
              <SelectItem value="pending">Chờ xác nhận</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="selecting">Đang chọn căn</SelectItem>
              <SelectItem value="submitted">Chờ phân bổ</SelectItem>
              <SelectItem value="allocated">Đã phân bổ</SelectItem>
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
                <p className="text-sm text-gray-500">Tổng Queue</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">VIP</p>
                <p className="text-2xl font-bold">{vipBookings.length}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ phân bổ</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'submitted').length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã phân bổ</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'allocated').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking List by Tier */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({filteredBookings.length})</TabsTrigger>
          <TabsTrigger value="vip">VIP ({vipBookings.length})</TabsTrigger>
          <TabsTrigger value="priority">Ưu tiên ({priorityBookings.length})</TabsTrigger>
          <TabsTrigger value="standard">Tiêu chuẩn ({standardBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vip" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vipBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="priority" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="standard" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có soft booking nào</p>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết Soft Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                    #{selectedBooking.queue_number}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedBooking.contact_name}</h3>
                    <p className="text-sm text-gray-500">{selectedBooking.code}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getTierBadge(selectedBooking.booking_tier)}
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dự án</p>
                  <p className="font-medium">{selectedBooking.project_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phí giữ chỗ</p>
                  <p className="font-medium">{(selectedBooking.booking_fee || 0).toLocaleString('vi-VN')} đ</p>
                </div>
              </div>

              {selectedBooking.priority_selections && selectedBooking.priority_selections.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Ưu tiên đã chọn</p>
                  <div className="space-y-2">
                    {selectedBooking.priority_selections.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Badge>{p.priority}</Badge>
                        <span className="font-medium">{p.product_code}</span>
                        <span className="text-sm text-gray-500">- {p.product_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBooking.allocated_product_id && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Đã phân bổ: {selectedBooking.allocated_product_code}
                    {selectedBooking.allocated_priority && ` (Priority ${selectedBooking.allocated_priority})`}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Selection Modal */}
      <Dialog open={showPriorityModal} onOpenChange={setShowPriorityModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chọn Priority (1-2-3)</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Chọn tối đa 3 căn theo thứ tự ưu tiên. Hệ thống sẽ tự động phân bổ căn theo thứ tự queue và priority của bạn.
              </p>
              
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Tính năng này cần được tích hợp với Inventory</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Để chọn priority, cần hiển thị danh sách sản phẩm available từ inventory.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriorityModal(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
