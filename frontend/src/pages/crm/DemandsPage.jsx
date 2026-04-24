/**
 * Demand Profiles Page
 * Prompt 6/20 - CRM Unified Profile Standardization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { demandsAPI, contactsAPI } from '@/lib/crmApi';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Building2,
  DollarSign,
  MapPin,
  Home,
  Bed,
  Compass,
  Eye,
  Target,
  RefreshCw,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import DemandProfileForm from '@/components/crm/DemandProfileForm';

const DEMO_CONTACTS = [
  { id: 'contact-demo-1', full_name: 'Nguyễn Minh Anh' },
  { id: 'contact-demo-2', full_name: 'Lê Thu Trang' },
  { id: 'contact-demo-3', full_name: 'Phạm Quốc Bảo' },
];

const DEMO_DEMANDS = [
  {
    id: 'demand-demo-1',
    contact_id: 'contact-demo-1',
    contact_name: 'Nguyễn Minh Anh',
    created_at: '2026-03-24T09:30:00Z',
    urgency: 'immediate',
    purpose: 'residence',
    budget_display: '3,8 - 4,2 tỷ',
    property_types: ['Căn hộ 2PN', 'Căn góc'],
    area_display: '72 - 85m²',
    bedrooms_min: 2,
    bedrooms_max: 2,
    preferred_districts: ['Thủ Đức', 'Quận 2'],
    matched_product_count: 6,
    is_active: true,
  },
  {
    id: 'demand-demo-2',
    contact_id: 'contact-demo-2',
    contact_name: 'Lê Thu Trang',
    created_at: '2026-03-23T14:10:00Z',
    urgency: 'short_term',
    purpose: 'investment',
    budget_display: '6,5 - 7,5 tỷ',
    property_types: ['Shophouse', 'Căn hộ 3PN'],
    area_display: '95 - 120m²',
    bedrooms_min: 3,
    bedrooms_max: 3,
    preferred_districts: ['Bình Thạnh', 'Quận 7', 'Thủ Đức'],
    matched_product_count: 4,
    is_active: true,
  },
  {
    id: 'demand-demo-3',
    contact_id: 'contact-demo-3',
    contact_name: 'Phạm Quốc Bảo',
    created_at: '2026-03-22T11:20:00Z',
    urgency: 'medium_term',
    purpose: 'both',
    budget_display: '2,5 - 3 tỷ',
    property_types: ['Studio', '1PN+'],
    area_display: '42 - 55m²',
    bedrooms_min: 1,
    bedrooms_max: 1,
    preferred_districts: ['Nhà Bè', 'Quận 7'],
    matched_product_count: 3,
    is_active: false,
  },
];

function buildDemoDemands(filters) {
  const keyword = filters.search?.trim().toLowerCase() || '';

  return DEMO_DEMANDS.filter((demand) => {
    if (filters.is_active && !demand.is_active) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const haystack = [
      demand.contact_name,
      demand.budget_display,
      demand.area_display,
      ...(demand.property_types || []),
      ...(demand.preferred_districts || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  });
}

export default function DemandsPage() {
  const navigate = useNavigate();
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [matchResults, setMatchResults] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    is_active: true,
    search: '',
  });

  const loadData = useCallback(async () => {
    try {
      const contactsRes = await contactsAPI.getAll({ limit: 100 });
      const contactItems = contactsRes.data || [];
      setContacts(contactItems.length > 0 ? contactItems : DEMO_CONTACTS);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts(DEMO_CONTACTS);
    }
  }, []);

  const loadDemands = useCallback(async () => {
    try {
      setLoading(true);
      const params = { is_active: filters.is_active };
      const response = await demandsAPI.getAll(params);
      const items = response.data || [];
      setDemands(items.length > 0 ? items : buildDemoDemands(filters));
    } catch (error) {
      console.error('Failed to load demands:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho nhu cầu khách hàng');
      setDemands(buildDemoDemands(filters));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  const handleMatchProducts = async (demand) => {
    setSelectedDemand(demand);
    setShowMatchModal(true);
    setMatchLoading(true);
    
    try {
      const response = await demandsAPI.matchProducts(demand.id);
      setMatchResults(response.data);
    } catch (error) {
      toast.error('Không thể tìm sản phẩm phù hợp');
      console.error('Failed to match products:', error);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleDemandCreated = () => {
    setShowAddModal(false);
    loadDemands();
  };

  const displayedDemands = useMemo(() => {
    const keyword = filters.search?.trim().toLowerCase() || '';

    return demands.filter((demand) => {
      if (!keyword) {
        return true;
      }

      const haystack = [
        demand.contact_name,
        demand.budget_display,
        demand.area_display,
        ...(demand.property_types || []),
        ...(demand.preferred_districts || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [demands, filters.search]);

  const getUrgencyBadge = (urgency) => {
    const colors = {
      immediate: 'bg-red-100 text-red-700',
      short_term: 'bg-orange-100 text-orange-700',
      medium_term: 'bg-amber-100 text-amber-700',
      long_term: 'bg-blue-100 text-blue-700',
      exploring: 'bg-slate-100 text-slate-700',
    };
    const labels = {
      immediate: 'Cần ngay',
      short_term: 'Ngắn hạn',
      medium_term: 'Trung hạn',
      long_term: 'Dài hạn',
      exploring: 'Tìm hiểu',
    };
    return (
      <Badge className={colors[urgency] || 'bg-slate-100 text-slate-700'}>
        {labels[urgency] || urgency}
      </Badge>
    );
  };

  const getPurposeBadge = (purpose) => {
    const labels = {
      residence: 'Để ở',
      investment: 'Đầu tư',
      flip: 'Lướt sóng',
      both: 'Ở + Đầu tư',
      business: 'Kinh doanh',
      gift: 'Tặng',
    };
    return (
      <Badge variant="outline">
        {labels[purpose] || purpose}
      </Badge>
    );
  };

  if (loading && demands.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6" data-testid="demands-page-loading">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="demands-page">
      <PageHeader
        title="Nhu cầu Khách hàng"
        subtitle="Demand Profiles - Quản lý nhu cầu BĐS chi tiết"
        breadcrumbs={[
          { label: 'CRM', path: '/crm' },
          { label: 'Nhu cầu', path: '/crm/demands' },
        ]}
        onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
        searchPlaceholder="Tìm kiếm nhu cầu..."
        onAddNew={() => setShowAddModal(true)}
        addNewLabel="Thêm Nhu cầu"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={filters.is_active}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="text-sm cursor-pointer">
                Chỉ hiện nhu cầu đang active
              </Label>
            </div>

            <Badge variant="outline" className="text-slate-600">
              {displayedDemands.length} nhu cầu
            </Badge>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDemands}
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Demands Grid */}
        {displayedDemands.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Chưa có nhu cầu nào</h3>
              <p className="text-slate-500 mb-4">Bắt đầu bằng cách thêm nhu cầu khách hàng đầu tiên</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-[#316585] hover:bg-[#264f68]">
                <Plus className="w-4 h-4 mr-2" />
                Thêm Nhu cầu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedDemands.map((demand) => (
              <Card 
                key={demand.id} 
                className="bg-white hover:shadow-lg transition-shadow cursor-pointer"
                data-testid={`demand-card-${demand.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {demand.contact_name || 'Unknown Contact'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(demand.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getUrgencyBadge(demand.urgency)}
                      {getPurposeBadge(demand.purpose)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Budget */}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-900">{demand.budget_display || 'Chưa xác định'}</span>
                  </div>

                  {/* Property Types */}
                  {demand.property_types?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-600">{demand.property_types.join(', ')}</span>
                    </div>
                  )}

                  {/* Area */}
                  {demand.area_display && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span className="text-slate-600">{demand.area_display}</span>
                    </div>
                  )}

                  {/* Bedrooms */}
                  {(demand.bedrooms_min || demand.bedrooms_max) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bed className="w-4 h-4 text-purple-600" />
                      <span className="text-slate-600">
                        {demand.bedrooms_min && demand.bedrooms_max 
                          ? `${demand.bedrooms_min}-${demand.bedrooms_max} PN`
                          : demand.bedrooms_min 
                            ? `Từ ${demand.bedrooms_min} PN`
                            : `Đến ${demand.bedrooms_max} PN`
                        }
                      </span>
                    </div>
                  )}

                  {/* Locations */}
                  {demand.preferred_districts?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span className="text-slate-600 line-clamp-1">
                        {demand.preferred_districts.slice(0, 3).join(', ')}
                        {demand.preferred_districts.length > 3 && '...'}
                      </span>
                    </div>
                  )}

                  {/* Match Results */}
                  {demand.matched_product_count > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Sản phẩm phù hợp</span>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {demand.matched_product_count}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); handleMatchProducts(demand); }}
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Khớp SP
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); navigate(`/crm/contacts?id=${demand.contact_id}`); }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Demand Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Nhu cầu Mới</DialogTitle>
            <DialogDescription>Nhập chi tiết nhu cầu BĐS của khách hàng</DialogDescription>
          </DialogHeader>
          <DemandProfileForm 
            contacts={contacts} 
            onSuccess={handleDemandCreated}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Match Results Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#316585]" />
              Sản phẩm phù hợp
            </DialogTitle>
            <DialogDescription>
              {selectedDemand?.contact_name} - {selectedDemand?.budget_display}
            </DialogDescription>
          </DialogHeader>
          
          {matchLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-slate-500">Đang tìm sản phẩm phù hợp...</p>
            </div>
          ) : matchResults ? (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-[#316585]">{matchResults.total_matches}</p>
                    <p className="text-sm text-slate-500">Tổng SP</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{matchResults.best_match_score}</p>
                    <p className="text-sm text-slate-500">Điểm cao nhất</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{Math.round(matchResults.avg_match_score)}</p>
                    <p className="text-sm text-slate-500">Điểm TB</p>
                  </CardContent>
                </Card>
              </div>

              {/* Match List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {matchResults.matches?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Không tìm thấy sản phẩm phù hợp
                  </div>
                ) : (
                  matchResults.matches?.map((match, idx) => (
                    <Card key={match.product_id} className="bg-white border hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-400">#{idx + 1}</span>
                              <h4 className="font-semibold text-slate-900">{match.product_name || match.product_code}</h4>
                              <Badge className={match.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                                {match.is_available ? 'Còn hàng' : match.inventory_status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">{match.project_name}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span>{match.area}m²</span>
                              <span>{match.bedrooms} PN</span>
                              {match.floor && <span>Tầng {match.floor}</span>}
                              {match.direction && <span>{match.direction}</span>}
                            </div>
                            {match.match_notes?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {match.match_notes.map((note, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {note}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-[#316585]">{match.match_score}</div>
                            <p className="text-xs text-slate-500">điểm</p>
                            <Progress value={match.match_score} className="w-16 h-2 mt-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : null}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
