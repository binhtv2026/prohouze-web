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
  Layers,
  Home,
  BedDouble,
  Square,
  DollarSign,
  Eye,
} from 'lucide-react';

const statusColors = {
  available: 'bg-green-100 text-green-700',
  booked: 'bg-amber-100 text-amber-700',
  reserved: 'bg-blue-100 text-blue-700',
  sold: 'bg-slate-100 text-slate-700',
};

const productTypeLabels = {
  apartment: 'Căn hộ',
  villa: 'Biệt thự',
  townhouse: 'Nhà phố',
  shophouse: 'Shophouse',
  land: 'Đất nền',
};

const DEMO_PRODUCTS = [
  { id: 'product-1', code: 'A2-1208', name: 'A2-1208', project_name: 'The Privé Residence', status: 'available', area: 78, bedrooms: 2, price: 4250000000, product_type: 'apartment' },
  { id: 'product-2', code: 'B1-0910', name: 'B1-0910', project_name: 'Masteri Lumière', status: 'reserved', area: 52, bedrooms: 1, price: 2890000000, product_type: 'apartment' },
  { id: 'product-3', code: 'GH-1205', name: 'GH-1205', project_name: 'Glory Heights', status: 'booked', area: 81, bedrooms: 2, price: 3680000000, product_type: 'apartment' },
  { id: 'product-4', code: 'SH-01', name: 'Shophouse SH-01', project_name: 'The 9 Stellars', status: 'available', area: 120, bedrooms: null, price: 9800000000, product_type: 'shophouse' },
];

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/sales/products';
      const params = [];
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (typeFilter !== 'all') params.push(`product_type=${typeFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      const items = res.data || [];
      setProducts(items.length > 0 ? items : DEMO_PRODUCTS.filter((item) => {
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchType = typeFilter === 'all' || item.product_type === typeFilter;
        return matchStatus && matchType;
      }));
    } catch (error) {
      console.error('Error:', error);
      setProducts(DEMO_PRODUCTS.filter((item) => {
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchType = typeFilter === 'all' || item.product_type === typeFilter;
        return matchStatus && matchType;
      }));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="products-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Sản phẩm</h1>
          <p className="text-slate-500 text-sm mt-1">Căn hộ, nhà phố, biệt thự, đất nền</p>
        </div>
        <Button data-testid="add-product-btn">
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo mã, tên..."
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
            <SelectItem value="available">Còn hàng</SelectItem>
            <SelectItem value="booked">Đã đặt cọc</SelectItem>
            <SelectItem value="reserved">Giữ chỗ</SelectItem>
            <SelectItem value="sold">Đã bán</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Loại SP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="apartment">Căn hộ</SelectItem>
            <SelectItem value="villa">Biệt thự</SelectItem>
            <SelectItem value="townhouse">Nhà phố</SelectItem>
            <SelectItem value="shophouse">Shophouse</SelectItem>
            <SelectItem value="land">Đất nền</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Còn hàng</p>
                <p className="text-xl font-bold text-green-700">
                  {products.filter(p => p.status === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Đã cọc</p>
                <p className="text-xl font-bold text-amber-700">
                  {products.filter(p => p.status === 'booked').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Đã bán</p>
                <p className="text-xl font-bold text-blue-700">
                  {products.filter(p => p.status === 'sold').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Tổng SP</p>
                <p className="text-xl font-bold text-purple-700">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Layers className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Chưa có sản phẩm nào</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden" data-testid={`product-${product.id}`}>
              {/* Image */}
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Home className="h-12 w-12 text-slate-400" />
              </div>
              <CardContent className="pt-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{product.name || product.code}</p>
                    <p className="text-xs text-slate-500">{product.project_name}</p>
                  </div>
                  <Badge className={statusColors[product.status]}>
                    {product.status === 'available' ? 'Còn hàng' :
                     product.status === 'booked' ? 'Đã cọc' :
                     product.status === 'reserved' ? 'Giữ chỗ' : 'Đã bán'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Square className="h-3 w-3" />
                    {product.area || 0} m²
                  </span>
                  {product.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      {product.bedrooms} PN
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-bold text-green-600">
                    {product.price ? formatCurrency(product.price) : 'Liên hệ'}
                  </p>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
