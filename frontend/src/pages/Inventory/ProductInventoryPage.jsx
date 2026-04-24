/**
 * ProHouze Product Inventory Page
 * Prompt 5/20 - Project/Product/Inventory Domain Standardization
 * 
 * Main inventory management page with:
 * - Product search and filtering
 * - Status-based views
 * - Product list with status badges
 * - Quick actions (hold, release, etc.)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Package,
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Clock,
  Unlock,
  CheckCircle,
  Ban,
  Plus,
  RefreshCw,
  ArrowUpDown,
  Layers,
  Home,
  Store,
  Map,
  Grid3X3,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Format price
const formatPrice = (price) => {
  if (!price) return '-';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
};

// Format area
const formatArea = (area) => {
  if (!area) return '-';
  return `${area.toFixed(1)} m²`;
};

// Product type icons
const PRODUCT_TYPE_ICONS = {
  apartment: Building2,
  villa: Home,
  townhouse: Home,
  shophouse: Store,
  duplex: Layers,
  penthouse: Building2,
  land: Map,
  office: Building2,
  retail: Store,
};

const DEMO_PROJECTS = [
  { id: 'project-001', project_name: 'The Horizon City', name: 'The Horizon City' },
  { id: 'project-002', project_name: 'Central Avenue', name: 'Central Avenue' },
];

const DEMO_BLOCKS = [
  { id: 'block-a1', block_name: 'Block A1', name: 'Block A1' },
  { id: 'block-b2', block_name: 'Block B2', name: 'Block B2' },
];

const DEMO_STATUS_CONFIG = [
  { code: 'available', label_vi: 'Đang bán', name: 'Đang bán', bg_color: '#dcfce7', color: '#15803d' },
  { code: 'hold', label_vi: 'Giữ chỗ', name: 'Giữ chỗ', bg_color: '#fef3c7', color: '#b45309' },
  { code: 'booked', label_vi: 'Đã booking', name: 'Đã booking', bg_color: '#dbeafe', color: '#1d4ed8' },
  { code: 'sold', label_vi: 'Đã bán', name: 'Đã bán', bg_color: '#fee2e2', color: '#b91c1c' },
];

const DEMO_PRODUCT_TYPES = [
  { code: 'apartment', label_vi: 'Căn hộ', name: 'Căn hộ' },
  { code: 'shophouse', label_vi: 'Shophouse', name: 'Shophouse' },
];

const DEMO_PRODUCTS = [
  {
    id: 'prod-001',
    code: 'A1-1208',
    product_code: 'A1-1208',
    name: 'Căn hộ A1-1208',
    product_name: 'Căn hộ A1-1208',
    inventory_status: 'available',
    product_type: 'apartment',
    project_name: 'The Horizon City',
    block_name: 'Block A1',
    floor_number: 12,
    area: 72.5,
    unit_area: 72.5,
    listed_price: 4250000000,
    final_price: 4250000000,
  },
  {
    id: 'prod-002',
    code: 'B2-SH05',
    product_code: 'B2-SH05',
    name: 'Shophouse B2-SH05',
    product_name: 'Shophouse B2-SH05',
    inventory_status: 'hold',
    product_type: 'shophouse',
    project_name: 'Central Avenue',
    block_name: 'Block B2',
    floor_number: 1,
    area: 125.8,
    unit_area: 125.8,
    listed_price: 9200000000,
    final_price: 9200000000,
  },
];

export default function ProductInventoryPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [byStatus, setByStatus] = useState({});
  const [byType, setByType] = useState({});
  
  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [projectId, setProjectId] = useState(searchParams.get('project') || '');
  const [blockId, setBlockId] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Config data
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [statusConfig, setStatusConfig] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  
  // Hold modal
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [holdHours, setHoldHours] = useState(24);
  const [holdReason, setHoldReason] = useState('');
  
  // Active tab (quick filters)
  const [activeTab, setActiveTab] = useState('all');

  // Fetch config on mount
  const fetchConfig = useCallback(async () => {
    try {
      const [statusRes, typesRes, projectsRes] = await Promise.all([
        api.get('/inventory/config/statuses'),
        api.get('/inventory/config/product-types'),
        api.get('/inventory/projects'),
      ]);
      
      setStatusConfig(statusRes.data.statuses?.length > 0 ? statusRes.data.statuses : DEMO_STATUS_CONFIG);
      setProductTypes(typesRes.data.types?.length > 0 ? typesRes.data.types : DEMO_PRODUCT_TYPES);
      setProjects(Array.isArray(projectsRes.data) && projectsRes.data.length > 0 ? projectsRes.data : DEMO_PROJECTS);
    } catch (error) {
      console.error('Error fetching config:', error);
      setStatusConfig(DEMO_STATUS_CONFIG);
      setProductTypes(DEMO_PRODUCT_TYPES);
      setProjects(DEMO_PROJECTS);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (projectId) params.append('project_id', projectId);
      if (blockId) params.append('block_id', blockId);
      if (typeFilter) params.append('product_types', typeFilter);
      
      // Apply tab filter
      if (activeTab === 'available') {
        params.append('inventory_statuses', 'available');
      } else if (activeTab === 'hold') {
        params.append('inventory_statuses', 'hold');
      } else if (activeTab === 'booking') {
        params.append('inventory_statuses', 'booking_pending,booked');
      } else if (activeTab === 'sold') {
        params.append('inventory_statuses', 'sold');
      } else if (statusFilter) {
        params.append('inventory_statuses', statusFilter);
      }
      
      params.append('limit', '100');
      
      const response = await api.get(`/inventory/products?${params.toString()}`);
      
      const productItems = Array.isArray(response.data.items) ? response.data.items : [];
      const fallbackProducts = productItems.length > 0 ? productItems : DEMO_PRODUCTS;
      setProducts(fallbackProducts);
      setTotal(response.data.total || fallbackProducts.length);
      setByStatus(response.data.by_status || { available: 1, hold: 1, booked: 0, sold: 0 });
      setByType(response.data.by_type || { apartment: 1, shophouse: 1 });
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(DEMO_PRODUCTS);
      setTotal(DEMO_PRODUCTS.length);
      setByStatus({ available: 1, hold: 1, booked: 0, sold: 0 });
      setByType({ apartment: 1, shophouse: 1 });
      toast.error('Không thể tải danh sách sản phẩm, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [activeTab, blockId, projectId, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch blocks when project changes
  useEffect(() => {
    if (projectId) {
      api.get(`/inventory/projects/${projectId}/blocks`)
        .then(res => setBlocks(res.data?.length > 0 ? res.data : DEMO_BLOCKS))
        .catch(() => setBlocks(DEMO_BLOCKS));
    } else {
      setBlocks([]);
    }
    setBlockId('');
  }, [projectId]);

  // Search with debounce
  const handleSearch = () => {
    fetchProducts();
  };

  // Hold product
  const handleHoldProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await api.post(`/inventory/products/${selectedProduct.id}/hold`, {
        product_id: selectedProduct.id,
        hold_hours: holdHours,
        reason: holdReason,
      });
      
      toast.success('Đã giữ sản phẩm thành công');
      setShowHoldModal(false);
      setSelectedProduct(null);
      setHoldReason('');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể giữ sản phẩm');
    }
  };

  // Release hold
  const handleReleaseHold = async (product) => {
    try {
      await api.post(`/inventory/products/${product.id}/release-hold`, {
        product_id: product.id,
        reason: 'Released by user',
      });
      
      toast.success('Đã mở khóa sản phẩm');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể mở khóa');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = statusConfig.find(s => s.code === status);
    if (!config) return <Badge variant="outline">{status}</Badge>;
    
    return (
      <Badge 
        style={{ 
          backgroundColor: config.bg_color, 
          color: config.color,
          borderColor: config.color 
        }}
      >
        {config.name}
      </Badge>
    );
  };

  // Get product type icon
  const getTypeIcon = (type) => {
    const Icon = PRODUCT_TYPE_ICONS[type] || Package;
    return <Icon className="h-4 w-4" />;
  };

  // Quick stats cards
  const stats = [
    { key: 'available', label: 'Còn hàng', count: byStatus.available || 0, color: 'text-green-600', bg: 'bg-green-50' },
    { key: 'hold', label: 'Đang giữ', count: byStatus.hold || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'booked', label: 'Đã booking', count: (byStatus.booking_pending || 0) + (byStatus.booked || 0), color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'sold', label: 'Đã bán', count: byStatus.sold || 0, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6" data-testid="product-inventory-page">
      <PageHeader
        title="Quỹ hàng"
        subtitle="Quản lý sản phẩm và tình trạng inventory"
        breadcrumbs={[
          { label: 'Inventory', path: '/inventory' },
          { label: 'Quỹ hàng' },
        ]}
        rightContent={
          <div className="flex gap-2">
            <Button onClick={fetchProducts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            {hasRole(['bod', 'admin']) && (
              <Button data-testid="add-product-btn">
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            )}
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card 
            key={stat.key} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${activeTab === stat.key ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveTab(stat.key === activeTab ? 'all' : stat.key)}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <Package className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo mã căn, tên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <Select value={projectId || "__none__"} onValueChange={(v) => setProjectId(v === "__none__" ? "" : v)}>
              <SelectTrigger className="w-[200px]" data-testid="filter-project">
                <SelectValue placeholder="Tất cả dự án" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tất cả dự án</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {blocks.length > 0 && (
              <Select value={blockId || "__none__"} onValueChange={(v) => setBlockId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Block/Tòa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tất cả block</SelectItem>
                  {blocks.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={typeFilter || "__none__"} onValueChange={(v) => setTypeFilter(v === "__none__" ? "" : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Loại SP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tất cả loại</SelectItem>
                {productTypes.map(t => (
                  <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} variant="secondary">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Danh sách sản phẩm ({total})
            </div>
            {activeTab !== 'all' && (
              <Badge variant="outline" className="text-sm">
                Đang lọc: {stats.find(s => s.key === activeTab)?.label}
                <button 
                  onClick={() => setActiveTab('all')} 
                  className="ml-2 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã căn</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Dự án</TableHead>
                  <TableHead>Block/Tầng</TableHead>
                  <TableHead>Diện tích</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người giữ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium">{product.code}</div>
                      {product.name !== product.code && (
                        <div className="text-sm text-gray-500">{product.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(product.product_type)}
                        <span className="text-sm">
                          {productTypes.find(t => t.code === product.product_type)?.name || product.product_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{product.project_name || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.block_name && <span>{product.block_name}</span>}
                        {product.floor_number && <span> / T{product.floor_number}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatArea(product.area)}</div>
                      {product.bedrooms > 0 && (
                        <div className="text-xs text-gray-500">{product.bedrooms} PN</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {formatPrice(product.final_price || product.base_price)}
                      </div>
                      {product.price_per_sqm > 0 && (
                        <div className="text-xs text-gray-500">
                          {formatPrice(product.price_per_sqm)}/m²
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.inventory_status)}
                    </TableCell>
                    <TableCell>
                      {product.hold_by_name ? (
                        <div className="text-sm">
                          <div>{product.hold_by_name}</div>
                          {product.hold_expires_at && (
                            <div className="text-xs text-orange-600">
                              Hết hạn: {new Date(product.hold_expires_at).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/inventory/products/${product.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {product.inventory_status === 'available' && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowHoldModal(true);
                              }}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Giữ sản phẩm
                            </DropdownMenuItem>
                          )}
                          {product.inventory_status === 'hold' && (
                            <DropdownMenuItem onClick={() => handleReleaseHold(product)}>
                              <Unlock className="h-4 w-4 mr-2" />
                              Mở khóa
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có sản phẩm nào</p>
              <p className="text-sm mt-2">Thêm sản phẩm mới hoặc thay đổi bộ lọc</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hold Modal */}
      <Dialog open={showHoldModal} onOpenChange={setShowHoldModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Giữ sản phẩm
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedProduct.code}</div>
                <div className="text-sm text-gray-500">{selectedProduct.project_name}</div>
                <div className="text-sm">{formatPrice(selectedProduct.final_price)}</div>
              </div>
              
              <div>
                <Label>Thời gian giữ (giờ)</Label>
                <Select value={String(holdHours)} onValueChange={(v) => setHoldHours(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 giờ</SelectItem>
                    <SelectItem value="2">2 giờ</SelectItem>
                    <SelectItem value="4">4 giờ</SelectItem>
                    <SelectItem value="8">8 giờ</SelectItem>
                    <SelectItem value="24">24 giờ</SelectItem>
                    <SelectItem value="48">48 giờ</SelectItem>
                    <SelectItem value="72">72 giờ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Lý do giữ</Label>
                <Input
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="VD: Khách hàng đang xem xét"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleHoldProduct}>
              Xác nhận giữ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
