/**
 * Sales Workboard Page
 * TASK 1 - SALES WORKING INTERFACE
 * 
 * Features:
 * - My Inventory với status badges
 * - Quick Actions (1-click hold, booking)
 * - Product detail modal
 * - Filter by status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  Clock,
  DollarSign,
  MapPin,
  Bed,
  Bath,
  Square,
  Play,
  Pause,
  ShoppingCart,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronRight,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import salesOpsApi from '@/api/salesOpsApi';

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status, display, color, bgColor }) => {
  const statusStyles = {
    available: 'bg-green-100 text-green-800 border-green-300',
    hold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    booking_pending: 'bg-orange-100 text-orange-800 border-orange-300',
    booked: 'bg-blue-100 text-blue-800 border-blue-300',
    reserved: 'bg-purple-100 text-purple-800 border-purple-300',
    sold: 'bg-gray-100 text-gray-800 border-gray-300',
    blocked: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Badge 
      variant="outline" 
      className={`${statusStyles[status] || 'bg-gray-100 text-gray-600'} font-medium`}
    >
      {display}
    </Badge>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ProductCard = ({ product, onViewDetail, onQuickAction, isLoading }) => {
  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (area) => {
    if (!area) return '-';
    return `${area.toFixed(1)} m²`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {product.product_code}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {product.title || 'Chưa có tên'}
            </CardDescription>
          </div>
          <StatusBadge
            status={product.inventory_status}
            display={product.status_display}
            color={product.status_color}
            bgColor={product.status_bg_color}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Project */}
        {product.project_name && (
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
            {product.project_name}
          </div>
        )}
        
        {/* Property Details */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {product.floor_no && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-3 h-3 mr-1 text-gray-400" />
              Tầng {product.floor_no}
            </div>
          )}
          {product.bedroom_count != null && (
            <div className="flex items-center text-gray-600">
              <Bed className="w-3 h-3 mr-1 text-gray-400" />
              {product.bedroom_count} PN
            </div>
          )}
          {product.built_area && (
            <div className="flex items-center text-gray-600">
              <Square className="w-3 h-3 mr-1 text-gray-400" />
              {formatArea(product.built_area)}
            </div>
          )}
        </div>
        
        {/* Pricing */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Giá bán</span>
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(product.sale_price || product.list_price)}
            </span>
          </div>
          {product.price_per_sqm && (
            <div className="text-xs text-gray-400 text-right">
              {formatPrice(product.price_per_sqm)}/m²
            </div>
          )}
        </div>
        
        {/* Hold Info */}
        {product.hold_by_me && product.hold_expires_at && (
          <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
            <Clock className="w-4 h-4 mr-2" />
            Hết hạn: {new Date(product.hold_expires_at).toLocaleString('vi-VN')}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetail(product)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Chi tiết
          </Button>
          
          {product.is_available && (
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onQuickAction(product.id, 'hold')}
              disabled={isLoading}
            >
              <Play className="w-4 h-4 mr-1" />
              Giữ chỗ
            </Button>
          )}
          
          {product.hold_by_me && product.inventory_status === 'hold' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-300"
                onClick={() => onQuickAction(product.id, 'release_hold')}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-1" />
                Hủy giữ
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onQuickAction(product.id, 'create_booking')}
                disabled={isLoading}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Booking
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════

const ProductDetailModal = ({ product, isOpen, onClose, onQuickAction, isLoading }) => {
  if (!product) return null;

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{product.product_code}</DialogTitle>
              <DialogDescription>{product.title || 'Chưa có tên'}</DialogDescription>
            </div>
            <StatusBadge
              status={product.inventory_status}
              display={product.status_display}
            />
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Giá niêm yết</p>
                <p className="text-lg font-semibold">{formatPrice(product.list_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Giá bán</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPrice(product.sale_price || product.list_price)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Property Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Thông tin căn hộ</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Tầng:</div>
                <div>{product.floor_no || '-'}</div>
                <div className="text-gray-500">Căn số:</div>
                <div>{product.unit_no || '-'}</div>
                <div className="text-gray-500">Phòng ngủ:</div>
                <div>{product.bedroom_count ?? '-'}</div>
                <div className="text-gray-500">Phòng tắm:</div>
                <div>{product.bathroom_count ?? '-'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Diện tích</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Thông thủy:</div>
                <div>{product.carpet_area ? `${product.carpet_area} m²` : '-'}</div>
                <div className="text-gray-500">Tim tường:</div>
                <div>{product.built_area ? `${product.built_area} m²` : '-'}</div>
                <div className="text-gray-500">Hướng:</div>
                <div>{product.direction || '-'}</div>
                <div className="text-gray-500">View:</div>
                <div>{product.view || '-'}</div>
              </div>
            </div>
          </div>
          
          {/* Hold Info */}
          {product.hold_by_user && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-800 mb-2">Thông tin giữ chỗ</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-amber-600">Người giữ:</span> {product.hold_by_user}</p>
                {product.hold_expires_at && (
                  <p><span className="text-amber-600">Hết hạn:</span> {new Date(product.hold_expires_at).toLocaleString('vi-VN')}</p>
                )}
                {product.hold_reason && (
                  <p><span className="text-amber-600">Lý do:</span> {product.hold_reason}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Recent Events */}
          {product.recent_events && product.recent_events.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Lịch sử gần đây</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {product.recent_events.map((event, idx) => (
                  <div key={idx} className="flex items-center text-sm py-1 border-b last:border-0">
                    <span className="text-gray-400 w-40">
                      {new Date(event.created_at).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-gray-500">{event.old_status}</span>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    <span className="font-medium">{event.new_status}</span>
                    {event.reason && (
                      <span className="text-gray-400 ml-2">({event.reason})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Valid Actions */}
          {product.valid_actions && product.valid_actions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Hành động có thể thực hiện</h4>
              <div className="flex flex-wrap gap-2">
                {product.valid_actions.includes('hold') && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => onQuickAction(product.id, 'hold')}
                    disabled={isLoading}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Giữ chỗ
                  </Button>
                )}
                {product.valid_actions.includes('release_hold') && (
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-300"
                    onClick={() => onQuickAction(product.id, 'release_hold')}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Hủy giữ chỗ
                  </Button>
                )}
                {product.valid_actions.includes('create_booking') && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => onQuickAction(product.id, 'create_booking')}
                    disabled={isLoading}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Tạo Booking
                  </Button>
                )}
                {product.valid_actions.includes('cancel_booking') && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300"
                    onClick={() => onQuickAction(product.id, 'cancel_booking')}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Hủy Booking
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STATS CARDS
// ═══════════════════════════════════════════════════════════════════════════

const StatsCard = ({ title, value, icon: Icon, color, onClick, isActive }) => (
  <Card 
    className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-blue-500' : ''}`}
    onClick={onClick}
  >
    <CardContent className="flex items-center p-4">
      <div className={`p-3 rounded-lg ${color} mr-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SalesWorkboardPage() {
  const navigate = useNavigate();
  
  // State
  const [inventory, setInventory] = useState({ items: [], total: 0, by_status: {} });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  
  // Load inventory
  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await salesOpsApi.getMyInventory({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        page_size: 20,
      });
      setInventory(data);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, page]);
  
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);
  
  // View product detail
  const handleViewDetail = async (product) => {
    try {
      const detail = await salesOpsApi.getProductDetail(product.id);
      setSelectedProduct(detail);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Lỗi tải chi tiết: ' + error.message);
    }
  };
  
  // Quick action
  const handleQuickAction = async (productId, action) => {
    setIsActionLoading(true);
    try {
      const result = await salesOpsApi.executeQuickAction(productId, action);
      toast.success(result.message);
      
      // Refresh data
      loadInventory();
      
      // Update modal if open
      if (selectedProduct && selectedProduct.id === productId) {
        const detail = await salesOpsApi.getProductDetail(productId);
        setSelectedProduct(detail);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Stats
  const stats = inventory.by_status || {};
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" data-testid="sales-workboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bàn làm việc Sales</h1>
          <p className="text-gray-500">Quản lý sản phẩm và giao dịch của bạn</p>
        </div>
        <Button onClick={loadInventory} disabled={isLoading} data-testid="refresh-btn">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Tất cả"
          value={inventory.total}
          icon={Package}
          color="bg-gray-500"
          onClick={() => setStatusFilter('')}
          isActive={!statusFilter}
        />
        <StatsCard
          title="Còn hàng"
          value={stats.available || 0}
          icon={CheckCircle}
          color="bg-green-500"
          onClick={() => setStatusFilter('available')}
          isActive={statusFilter === 'available'}
        />
        <StatsCard
          title="Đang giữ"
          value={stats.hold || 0}
          icon={Clock}
          color="bg-yellow-500"
          onClick={() => setStatusFilter('hold')}
          isActive={statusFilter === 'hold'}
        />
        <StatsCard
          title="Chờ Booking"
          value={stats.booking_pending || 0}
          icon={AlertCircle}
          color="bg-orange-500"
          onClick={() => setStatusFilter('booking_pending')}
          isActive={statusFilter === 'booking_pending'}
        />
        <StatsCard
          title="Đã đặt cọc"
          value={stats.booked || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
          onClick={() => setStatusFilter('booked')}
          isActive={statusFilter === 'booked'}
        />
        <StatsCard
          title="Đã bán"
          value={stats.sold || 0}
          icon={DollarSign}
          color="bg-purple-500"
          onClick={() => setStatusFilter('sold')}
          isActive={statusFilter === 'sold'}
        />
      </div>
      
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã căn, tên..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="status-filter">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả trạng thái</SelectItem>
            <SelectItem value="available">Còn hàng</SelectItem>
            <SelectItem value="hold">Đang giữ</SelectItem>
            <SelectItem value="booking_pending">Chờ Booking</SelectItem>
            <SelectItem value="booked">Đã đặt cọc</SelectItem>
            <SelectItem value="reserved">Đã giữ chỗ</SelectItem>
            <SelectItem value="sold">Đã bán</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : inventory.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Không có sản phẩm nào</p>
            <p className="text-sm text-gray-400 mt-1">
              Hãy liên hệ quản lý để được phân bổ sản phẩm
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {inventory.items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetail={handleViewDetail}
              onQuickAction={handleQuickAction}
              isLoading={isActionLoading}
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {inventory.total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Trước
          </Button>
          <span className="text-sm text-gray-500">
            Trang {page} / {Math.ceil(inventory.total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(inventory.total / 20)}
            onClick={() => setPage(p => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
      
      {/* Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onQuickAction={handleQuickAction}
        isLoading={isActionLoading}
      />
    </div>
  );
}
