/**
 * Sales Event & Allocation Page - Prompt 8/20
 * Event setup, run allocation, view results
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { salesEventApi, salesConfigApi } from '@/lib/salesApi';
import { 
  Plus,
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  Users,
  Building,
  AlertTriangle,
  Clock,
  Target,
  BarChart
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalesEventPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationResults, setAllocationResults] = useState(null);
  const [runningAllocation, setRunningAllocation] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const eventsData = await salesEventApi.getEvents({ limit: 50 });
      setEvents(eventsData);
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllocation = async () => {
    if (!selectedEvent) return;
    
    try {
      setRunningAllocation(true);
      const results = await salesEventApi.runAllocation(selectedEvent.id);
      setAllocationResults(results);
      toast.success(`Phân bổ hoàn tất: ${results.successful}/${results.total_bookings} thành công`);
      loadData();
    } catch (err) {
      console.error('Allocation failed:', err);
      toast.error('Phân bổ thất bại');
    } finally {
      setRunningAllocation(false);
    }
  };

  const handleViewResults = async (event) => {
    try {
      const results = await salesEventApi.getAllocationResults(event.id);
      setAllocationResults(results);
      setSelectedEvent(event);
      setShowAllocationModal(true);
    } catch (err) {
      toast.error('Không thể tải kết quả phân bổ');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      registration: 'bg-blue-100 text-blue-700',
      selection: 'bg-amber-100 text-amber-700',
      allocation: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels = {
      draft: 'Nháp',
      registration: 'Đang nhận ĐK',
      selection: 'Đang chọn căn',
      allocation: 'Đang phân bổ',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100'} variant="secondary">
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="sales-event-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sales Events</h1>
          <p className="text-gray-500">Quản lý đợt mở bán & phân bổ</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang diễn ra</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => ['registration', 'selection', 'allocation'].includes(e.status)).length}
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
                <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, e) => sum + (e.total_products || 0), 0)}
                </p>
              </div>
              <Building className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã phân bổ</p>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, e) => sum + (e.allocated_count || 0), 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                {getStatusBadge(event.status)}
                <span className="text-sm text-gray-500">{event.code}</span>
              </div>
              <CardTitle className="text-lg">{event.name}</CardTitle>
              <p className="text-sm text-gray-500">{event.project_name}</p>
            </CardHeader>
            <CardContent>
              {/* Timeline */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">ĐK:</span>
                  <span>{formatDate(event.registration_start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Phân bổ:</span>
                  <span>{formatDate(event.allocation_date)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-lg font-bold">{event.total_products}</p>
                  <p className="text-xs text-gray-500">Sản phẩm</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-lg font-bold">{event.total_bookings || 0}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-lg font-bold text-green-600">{event.allocated_count || 0}</p>
                  <p className="text-xs text-gray-500">Đã phân bổ</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowDetailModal(true);
                  }}
                >
                  Chi tiết
                </Button>
                {event.status === 'selection' && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedEvent(event);
                      setAllocationResults(null);
                      setShowAllocationModal(true);
                    }}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Phân bổ
                  </Button>
                )}
                {event.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewResults(event)}
                  >
                    <BarChart className="h-4 w-4 mr-1" />
                    Kết quả
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có sales event nào</p>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết Sales Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedEvent.name}</h3>
                  <p className="text-sm text-gray-500">{selectedEvent.code}</p>
                </div>
                {getStatusBadge(selectedEvent.status)}
              </div>

              <div>
                <p className="text-sm text-gray-500">Dự án</p>
                <p className="font-medium">{selectedEvent.project_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bắt đầu đăng ký</p>
                  <p className="font-medium">{formatDate(selectedEvent.registration_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kết thúc đăng ký</p>
                  <p className="font-medium">{formatDate(selectedEvent.registration_end)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bắt đầu chọn căn</p>
                  <p className="font-medium">{formatDate(selectedEvent.selection_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày phân bổ</p>
                  <p className="font-medium">{formatDate(selectedEvent.allocation_date)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Phí giữ chỗ</p>
                <p className="font-medium">{(selectedEvent.booking_fee || 0).toLocaleString('vi-VN')} đ</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocation Modal */}
      <Dialog open={showAllocationModal} onOpenChange={setShowAllocationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {allocationResults ? 'Kết quả phân bổ' : 'Chạy Allocation Engine'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.name}
            </DialogDescription>
          </DialogHeader>
          
          {!allocationResults ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Lưu ý quan trọng</p>
                    <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                      <li>Allocation sẽ phân bổ căn theo thứ tự queue và priority</li>
                      <li>Căn đã phân bổ sẽ được lock ngay lập tức</li>
                      <li>Không thể hoàn tác sau khi chạy</li>
                    </ul>
                  </div>
                </div>
              </div>

              {selectedEvent && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">{selectedEvent.total_products}</p>
                    <p className="text-sm text-gray-500">Sản phẩm</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">{selectedEvent.total_bookings || 0}</p>
                    <p className="text-sm text-gray-500">Bookings</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">{selectedEvent.manual_pending || 0}</p>
                    <p className="text-sm text-gray-500">Chờ manual</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-2xl font-bold">{allocationResults.total_bookings}</p>
                  <p className="text-sm text-gray-500">Tổng</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-600">{allocationResults.successful}</p>
                  <p className="text-sm text-gray-500">Thành công</p>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <p className="text-2xl font-bold text-red-600">{allocationResults.failed}</p>
                  <p className="text-sm text-gray-500">Thất bại</p>
                </div>
                <div className="p-3 bg-amber-50 rounded">
                  <p className="text-2xl font-bold text-amber-600">{allocationResults.manual_required}</p>
                  <p className="text-sm text-gray-500">Cần manual</p>
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {allocationResults.results?.map((result, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded flex items-center justify-between ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">#{result.queue_number} - {result.contact_name}</p>
                        <p className="text-sm text-gray-500">{result.soft_booking_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {result.success ? (
                        <Badge className="bg-green-100 text-green-700">
                          {result.product_code} (P{result.allocated_priority})
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">{result.reason}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocationModal(false)}>
              Đóng
            </Button>
            {!allocationResults && (
              <Button onClick={handleRunAllocation} disabled={runningAllocation}>
                {runningAllocation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang chạy...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Chạy Allocation
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
