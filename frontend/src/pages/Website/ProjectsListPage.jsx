import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  ChevronRight,
  Search,
  Grid,
  List,
  Heart,
  Square,
  Filter,
  X,
  Building2,
  Home,
  TreePine,
  Store,
  Hotel,
  Warehouse,
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';
import { SUN_GROUP_PROJECTS } from '@/data/sunGroupProjects';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API_AVAILABLE = API_URL && API_URL.startsWith('https');

// ===== PHÂN LOẠI BẤT ĐỘNG SẢN THEO CHUẨN VIỆT NAM =====
// Theo Luật Kinh doanh Bất động sản 2024 và thực tế thị trường

const PROPERTY_TYPES = [
  { value: 'all', label: 'Tất cả loại hình', icon: Building2 },
  { value: 'apartment', label: 'Căn hộ chung cư', icon: Building2 },
  { value: 'villa', label: 'Biệt thự', icon: Home },
  { value: 'townhouse', label: 'Nhà phố liền kề', icon: Home },
  { value: 'shophouse', label: 'Shophouse', icon: Store },
  { value: 'land', label: 'Đất nền', icon: TreePine },
  { value: 'condotel', label: 'Condotel', icon: Hotel },
  { value: 'officetel', label: 'Officetel', icon: Warehouse },
];

// Danh sách tỉnh/thành phố chính có BĐS
const PROVINCES = [
  { value: 'all', label: 'Tất cả tỉnh/thành' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'Bình Dương', label: 'Bình Dương' },
  { value: 'Đồng Nai', label: 'Đồng Nai' },
  { value: 'Khánh Hòa', label: 'Khánh Hòa' },
  { value: 'Quảng Ninh', label: 'Quảng Ninh' },
  { value: 'Bà Rịa - Vũng Tàu', label: 'Bà Rịa - Vũng Tàu' },
  { value: 'Hải Phòng', label: 'Hải Phòng' },
  { value: 'Cần Thơ', label: 'Cần Thơ' },
];

// Quận/huyện theo từng tỉnh/thành
const DISTRICTS_BY_PROVINCE = {
  'Đà Nẵng': [
    { value: 'all', label: 'Tất cả quận/huyện' },
    { value: 'Hải Châu', label: 'Quận Hải Châu' },
    { value: 'Thanh Khê', label: 'Quận Thanh Khê' },
    { value: 'Sơn Trà', label: 'Quận Sơn Trà' },
    { value: 'Ngũ Hành Sơn', label: 'Quận Ngũ Hành Sơn' },
    { value: 'Liên Chiểu', label: 'Quận Liên Chiểu' },
    { value: 'Cẩm Lệ', label: 'Quận Cẩm Lệ' },
    { value: 'Hòa Vang', label: 'Huyện Hòa Vang' },
  ],
  'Hồ Chí Minh': [
    { value: 'all', label: 'Tất cả quận/huyện' },
    { value: 'Quận 1', label: 'Quận 1' },
    { value: 'Quận 2', label: 'Quận 2' },
    { value: 'Quận 3', label: 'Quận 3' },
    { value: 'Quận 4', label: 'Quận 4' },
    { value: 'Quận 5', label: 'Quận 5' },
    { value: 'Quận 6', label: 'Quận 6' },
    { value: 'Quận 7', label: 'Quận 7' },
    { value: 'Quận 8', label: 'Quận 8' },
    { value: 'Quận 9', label: 'Quận 9' },
    { value: 'Quận 10', label: 'Quận 10' },
    { value: 'Quận 11', label: 'Quận 11' },
    { value: 'Quận 12', label: 'Quận 12' },
    { value: 'Bình Thạnh', label: 'Quận Bình Thạnh' },
    { value: 'Gò Vấp', label: 'Quận Gò Vấp' },
    { value: 'Phú Nhuận', label: 'Quận Phú Nhuận' },
    { value: 'Tân Bình', label: 'Quận Tân Bình' },
    { value: 'Tân Phú', label: 'Quận Tân Phú' },
    { value: 'Thủ Đức', label: 'TP. Thủ Đức' },
    { value: 'Bình Tân', label: 'Quận Bình Tân' },
    { value: 'Nhà Bè', label: 'Huyện Nhà Bè' },
    { value: 'Hóc Môn', label: 'Huyện Hóc Môn' },
    { value: 'Củ Chi', label: 'Huyện Củ Chi' },
    { value: 'Cần Giờ', label: 'Huyện Cần Giờ' },
  ],
  'Hà Nội': [
    { value: 'all', label: 'Tất cả quận/huyện' },
    { value: 'Ba Đình', label: 'Quận Ba Đình' },
    { value: 'Hoàn Kiếm', label: 'Quận Hoàn Kiếm' },
    { value: 'Hai Bà Trưng', label: 'Quận Hai Bà Trưng' },
    { value: 'Đống Đa', label: 'Quận Đống Đa' },
    { value: 'Tây Hồ', label: 'Quận Tây Hồ' },
    { value: 'Cầu Giấy', label: 'Quận Cầu Giấy' },
    { value: 'Thanh Xuân', label: 'Quận Thanh Xuân' },
    { value: 'Hoàng Mai', label: 'Quận Hoàng Mai' },
    { value: 'Long Biên', label: 'Quận Long Biên' },
    { value: 'Nam Từ Liêm', label: 'Quận Nam Từ Liêm' },
    { value: 'Bắc Từ Liêm', label: 'Quận Bắc Từ Liêm' },
    { value: 'Hà Đông', label: 'Quận Hà Đông' },
    { value: 'Gia Lâm', label: 'Huyện Gia Lâm' },
    { value: 'Đông Anh', label: 'Huyện Đông Anh' },
    { value: 'Hoài Đức', label: 'Huyện Hoài Đức' },
  ],
  'Bình Dương': [
    { value: 'all', label: 'Tất cả quận/huyện' },
    { value: 'Thủ Dầu Một', label: 'TP. Thủ Dầu Một' },
    { value: 'Thuận An', label: 'TP. Thuận An' },
    { value: 'Dĩ An', label: 'TP. Dĩ An' },
    { value: 'Tân Uyên', label: 'TX. Tân Uyên' },
    { value: 'Bến Cát', label: 'TX. Bến Cát' },
  ],
  'Đồng Nai': [
    { value: 'all', label: 'Tất cả quận/huyện' },
    { value: 'Biên Hòa', label: 'TP. Biên Hòa' },
    { value: 'Long Thành', label: 'Huyện Long Thành' },
    { value: 'Nhơn Trạch', label: 'Huyện Nhơn Trạch' },
    { value: 'Trảng Bom', label: 'Huyện Trảng Bom' },
  ],
  'Khánh Hòa': [
    { value: 'all', label: 'Tất cả quận/huyện' },
    { value: 'Nha Trang', label: 'TP. Nha Trang' },
    { value: 'Cam Ranh', label: 'TP. Cam Ranh' },
    { value: 'Cam Lâm', label: 'Huyện Cam Lâm' },
  ],
  'Quảng Ninh': [
    { value: 'all', label: 'Tất cả quận/huyện' },
    { value: 'Hạ Long', label: 'TP. Hạ Long' },
    { value: 'Cẩm Phả', label: 'TP. Cẩm Phả' },
    { value: 'Vân Đồn', label: 'Huyện Vân Đồn' },
  ],
};

// Mức giá theo chuẩn thị trường VN
const PRICE_RANGES = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: '0-2', label: 'Dưới 2 tỷ' },
  { value: '2-5', label: '2 - 5 tỷ' },
  { value: '5-10', label: '5 - 10 tỷ' },
  { value: '10-20', label: '10 - 20 tỷ' },
  { value: '20-50', label: '20 - 50 tỷ' },
  { value: '50+', label: 'Trên 50 tỷ' },
];

// Trạng thái dự án
const PROJECT_STATUS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'opening', label: 'Đang mở bán' },
  { value: 'coming_soon', label: 'Sắp mở bán' },
  { value: 'sold_out', label: 'Đã bán hết' },
  { value: 'handover', label: 'Đã bàn giao' },
];

// Diện tích
const AREA_RANGES = [
  { value: 'all', label: 'Tất cả diện tích' },
  { value: '0-50', label: 'Dưới 50m²' },
  { value: '50-100', label: '50 - 100m²' },
  { value: '100-200', label: '100 - 200m²' },
  { value: '200-500', label: '200 - 500m²' },
  { value: '500+', label: 'Trên 500m²' },
];

// Helper to format price in Vietnamese
const formatPrice = (price) => {
  if (!price) return 'Liên hệ';
  if (price >= 1000000000) {
    return `Từ ${(price / 1000000000).toFixed(1)} tỷ`;
  }
  return `Từ ${(price / 1000000).toFixed(0)} triệu`;
};

// Helper to get price range category
const getPriceRange = (price) => {
  if (!price) return '2-5';
  const priceInBillion = price / 1000000000;
  if (priceInBillion >= 50) return '50+';
  if (priceInBillion >= 20) return '20-50';
  if (priceInBillion >= 10) return '10-20';
  if (priceInBillion >= 5) return '5-10';
  if (priceInBillion >= 2) return '2-5';
  return '0-2';
};

// Helper to get area range from area string
const getAreaRange = (areaStr) => {
  if (!areaStr) return 'all';
  // Extract first number from area string like "45 - 263 m²"
  const match = areaStr.match(/(\d+)/);
  if (!match) return 'all';
  const minArea = parseInt(match[1]);
  if (minArea >= 500) return '500+';
  if (minArea >= 200) return '200-500';
  if (minArea >= 100) return '100-200';
  if (minArea >= 50) return '50-100';
  return '0-50';
};

// Get property type label
const getPropertyTypeLabel = (type) => {
  const typeMap = {
    'apartment': 'Căn hộ',
    'villa': 'Biệt thự',
    'townhouse': 'Nhà phố',
    'shophouse': 'Shophouse',
    'land': 'Đất nền',
    'condotel': 'Condotel',
    'officetel': 'Officetel',
  };
  return typeMap[type] || 'Căn hộ';
};

// Get status label
const getStatusLabel = (status) => {
  const statusMap = {
    'opening': 'Đang mở bán',
    'coming_soon': 'Sắp mở bán',
    'sold_out': 'Đã bán hết',
    'handover': 'Đã bàn giao',
  };
  return statusMap[status] || 'Đang mở bán';
};

// Transform API project to list format
const transformApiProject = (p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  // Location data
  province: p.location?.city || '',
  district: p.location?.district || '',
  address: p.location?.address || '',
  locationDisplay: p.location?.city ? `${p.location.district || ''}, ${p.location.city}` : (p.location?.address || ''),
  // Type data
  type: p.type || 'apartment',
  typeLabel: getPropertyTypeLabel(p.type),
  // Price data
  price: formatPrice(p.price_from),
  priceRange: getPriceRange(p.price_from),
  priceFrom: p.price_from || 0,
  // Images
  image: p.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
  // Status
  status: p.status || 'opening',
  statusLabel: getStatusLabel(p.status),
  // Other info
  hot: p.is_hot || false,
  units: p.units_available || 0,
  totalUnits: p.units_total || 0,
  area: p.area_range || '',
  areaRange: getAreaRange(p.area_range),
  developer: p.developer?.name || '',
  completionDate: p.completion_date || '',
  fromDB: true
});

const MOCK_PROJECTS = SUN_GROUP_PROJECTS;






export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');

  // Get available districts based on selected province
  const availableDistricts = useMemo(() => {
    if (provinceFilter === 'all') return [{ value: 'all', label: 'Chọn tỉnh/thành trước' }];
    return DISTRICTS_BY_PROVINCE[provinceFilter] || [{ value: 'all', label: 'Tất cả quận/huyện' }];
  }, [provinceFilter]);

  // Reset district when province changes
  useEffect(() => {
    setDistrictFilter('all');
  }, [provinceFilter]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (provinceFilter !== 'all') count++;
    if (districtFilter !== 'all') count++;
    if (priceFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (areaFilter !== 'all') count++;
    return count;
  }, [typeFilter, provinceFilter, districtFilter, priceFilter, statusFilter, areaFilter]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setProvinceFilter('all');
    setDistrictFilter('all');
    setPriceFilter('all');
    setStatusFilter('all');
    setAreaFilter('all');
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        if (!API_AVAILABLE) { setProjects(MOCK_PROJECTS.map(transformApiProject)); setLoading(false); return; }
      const response = await fetch(`${API_URL}/api/website/projects-list`);
        if (response.ok) {
          const dbProjects = await response.json();
          if (dbProjects && dbProjects.length > 0) {
            const transformed = dbProjects.map(transformApiProject);
            setProjects(transformed);
          } else {
            // Fallback if db is empty
            setProjects(MOCK_PROJECTS.map(transformApiProject));
          }
        } else {
          setProjects(MOCK_PROJECTS.map(transformApiProject));
        }
      } catch (error) {
        // silently handle: Error fetching projects:
        setProjects(MOCK_PROJECTS.map(transformApiProject));
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Type filter
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      
      // Province filter
      const matchProvince = provinceFilter === 'all' || 
        p.province.includes(provinceFilter) || 
        p.locationDisplay.includes(provinceFilter);
      
      // District filter
      const matchDistrict = districtFilter === 'all' || 
        p.district.includes(districtFilter) ||
        p.locationDisplay.includes(districtFilter);
      
      // Price filter
      const matchPrice = priceFilter === 'all' || p.priceRange === priceFilter;
      
      // Status filter
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      
      // Area filter
      const matchArea = areaFilter === 'all' || p.areaRange === areaFilter;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchLower) ||
        p.locationDisplay.toLowerCase().includes(searchLower) ||
        p.developer.toLowerCase().includes(searchLower) ||
        p.address.toLowerCase().includes(searchLower);
      
      return matchType && matchProvince && matchDistrict && matchPrice && matchStatus && matchArea && matchSearch;
    });
  }, [projects, typeFilter, provinceFilter, districtFilter, priceFilter, statusFilter, areaFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="projects-page">
      <WebsiteHeader />
      
      {/* Hero */}
      <section className="relative h-[35vh] flex items-center bg-[#316585]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#316585]/50 to-[#316585]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
          <span className="inline-block text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Dự án BĐS</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            KHÁM PHÁ DỰ ÁN
          </h1>
          <p className="text-base lg:text-lg text-white/80 max-w-2xl mx-auto">
            {projects.length.toLocaleString()} dự án từ các chủ đầu tư uy tín hàng đầu Việt Nam
          </p>
        </div>
      </section>

      {/* Main Filters - Always visible */}
      <section className="py-4 bg-white shadow-sm sticky top-20 lg:top-24 z-40 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search + Primary Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo tên dự án, địa chỉ, chủ đầu tư..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
                data-testid="search-input"
              />
            </div>

            {/* Property Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-11" data-testid="type-filter">
                <SelectValue placeholder="Loại hình BĐS" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4 text-slate-500" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Province/City */}
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-[160px] h-11" data-testid="province-filter">
                <SelectValue placeholder="Tỉnh/Thành phố" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map(prov => (
                  <SelectItem key={prov.value} value={prov.value}>{prov.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* District */}
            <Select 
              value={districtFilter} 
              onValueChange={setDistrictFilter}
              disabled={provinceFilter === 'all'}
            >
              <SelectTrigger className="w-[160px] h-11" data-testid="district-filter">
                <SelectValue placeholder="Quận/Huyện" />
              </SelectTrigger>
              <SelectContent>
                {availableDistricts.map(dist => (
                  <SelectItem key={dist.value} value={dist.value}>{dist.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filter Toggle */}
            <Button
              variant={showAdvancedFilters ? 'default' : 'outline'}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`h-11 gap-2 ${showAdvancedFilters ? 'bg-[#316585] hover:bg-[#264a5e]' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <Badge className="ml-1 bg-orange-500 hover:bg-orange-600 text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#316585] hover:bg-[#264a5e]' : ''}
                data-testid="grid-view-btn"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#316585] hover:bg-[#264a5e]' : ''}
                data-testid="list-view-btn"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Price Range */}
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-[150px] h-10" data-testid="price-filter">
                    <SelectValue placeholder="Mức giá" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map(range => (
                      <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-10" data-testid="status-filter">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Area */}
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-[150px] h-10" data-testid="area-filter">
                    <SelectValue placeholder="Diện tích" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_RANGES.map(range => (
                      <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <p className="text-slate-600">
              Tìm thấy <span className="font-bold text-slate-900">{filteredProjects.length}</span> dự án
              {activeFilterCount > 0 && <span className="text-sm text-slate-400 ml-2">({activeFilterCount} bộ lọc)</span>}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#316585]"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Không tìm thấy dự án</h3>
              <p className="text-slate-500 mb-4">Hãy thử thay đổi tiêu chí tìm kiếm</p>
              <Button onClick={clearAllFilters} className="bg-[#316585] hover:bg-[#264a5e]">
                Xóa bộ lọc
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.slug || project.id} 
                  data-testid={`project-card-${project.slug || project.id}`}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-sm"
                  onClick={() => navigate(`/projects/${project.slug || project.id}`)}
                >
                  <div className="relative h-48 lg:h-52 overflow-hidden">
                    <img loading="lazy"
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {project.hot && <Badge className="bg-red-500 text-white border-0">HOT</Badge>}
                      <Badge className="bg-white/90 text-slate-700 border-0">{project.statusLabel}</Badge>
                    </div>
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                  <CardContent className="p-4 lg:p-5">
                    <p className="text-xs text-[#316585] font-medium uppercase">{project.typeLabel}</p>
                    <h3 className="text-base lg:text-lg font-bold text-slate-900 mt-1 group-hover:text-[#316585] transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">{project.locationDisplay}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Square className="h-3 w-3" /> {project.area}
                      </span>
                      <span>{project.units.toLocaleString()} căn</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <p className="font-bold text-[#316585]">{project.price}</p>
                      <Button variant="ghost" size="sm" className="text-[#316585] hover:text-[#264a5e] p-0 h-auto">
                        Chi tiết <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.slug || project.id} 
                  data-testid={`project-list-${project.slug || project.id}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-sm"
                  onClick={() => navigate(`/projects/${project.slug || project.id}`)}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-72 h-48 sm:h-auto flex-shrink-0">
                      <img loading="lazy"
                        src={project.image}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                      {project.hot && (
                        <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0">HOT</Badge>
                      )}
                    </div>
                    <CardContent className="flex-1 p-5 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <Badge variant="outline" className="mb-2 text-xs">{project.typeLabel}</Badge>
                          <h3 className="text-lg lg:text-xl font-bold text-slate-900">{project.name}</h3>
                          <div className="flex items-center gap-1 text-slate-500 mt-1 text-sm">
                            <MapPin className="h-4 w-4" />
                            {project.locationDisplay}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xl lg:text-2xl font-bold text-[#316585]">{project.price}</p>
                          <Badge className="mt-2 bg-[#316585]/10 text-[#316585] border-0">{project.statusLabel}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 lg:gap-6 mt-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Square className="h-4 w-4" /> {project.area}
                        </span>
                        <span>{project.units.toLocaleString()} căn</span>
                        {project.developer && <span>CĐT: {project.developer}</span>}
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button className="bg-[#316585] hover:bg-[#264a5e]">Xem chi tiết</Button>
                        <Button variant="outline">Đăng ký tư vấn</Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
