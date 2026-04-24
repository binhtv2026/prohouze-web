/**
 * Pricing Management Page - Prompt 8/20
 * Pricing policies, payment plans, and promotions
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pricingApi, salesConfigApi } from '@/lib/salesApi';
import { 
  Plus,
  DollarSign,
  Percent,
  Gift,
  Calendar,
  Tag,
  Building,
  CreditCard,
  FileText,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_PRICING_POLICIES = [
  {
    id: 'policy-001',
    code: 'PRICE-EMERALD-01',
    name: 'Bang gia mo ban dot 1',
    status: 'active',
    project_name: 'The Emerald Residence',
    effective_from: '2026-03-01',
    effective_to: '2026-04-15',
    max_discount_percent: 3,
    adjustments: [{ type: 'booking', adjustment_value: 2 }]
  }
];

const DEMO_PAYMENT_PLANS = [
  {
    id: 'plan-001',
    code: 'PTTT-001',
    name: 'Thanh toan chuan 12 dot',
    status: 'active',
    payment_plan_type: 'standard',
    number_of_installments: 12,
    max_discount_percent: 2
  }
];

const DEMO_PROMOTIONS = [
  {
    id: 'promo-001',
    code: 'PROMO-001',
    name: 'Thuong nong mo ban cuoi tuan',
    status: 'active',
    effective_from: '2026-03-20',
    effective_to: '2026-03-31',
    benefit_type: 'cashback',
    value: 5000000
  }
];

const DEMO_PAYMENT_PLAN_TYPES = {
  standard: 'Thanh toan chuan',
  fast_payment: 'Thanh toan nhanh',
  bank_loan: 'Ho tro vay ngan hang'
};

export default function PricingManagementPage() {
  const [loading, setLoading] = useState(true);
  const [pricingPolicies, setPricingPolicies] = useState([]);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [paymentPlanTypes, setPaymentPlanTypes] = useState({});
  const [activeTab, setActiveTab] = useState('policies');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [policiesData, plansData, promosData, typesData] = await Promise.all([
        pricingApi.getPricingPolicies(),
        pricingApi.getPaymentPlans(),
        pricingApi.getPromotions(),
        salesConfigApi.getPaymentPlanTypes(),
      ]);
      
      setPricingPolicies(Array.isArray(policiesData) && policiesData.length > 0 ? policiesData : DEMO_PRICING_POLICIES);
      setPaymentPlans(Array.isArray(plansData) && plansData.length > 0 ? plansData : DEMO_PAYMENT_PLANS);
      setPromotions(Array.isArray(promosData) && promosData.length > 0 ? promosData : DEMO_PROMOTIONS);
      setPaymentPlanTypes(typesData?.types && Object.keys(typesData.types).length > 0 ? typesData.types : DEMO_PAYMENT_PLAN_TYPES);
    } catch (err) {
      console.error('Failed to load data:', err);
      setPricingPolicies(DEMO_PRICING_POLICIES);
      setPaymentPlans(DEMO_PAYMENT_PLANS);
      setPromotions(DEMO_PROMOTIONS);
      setPaymentPlanTypes(DEMO_PAYMENT_PLAN_TYPES);
      toast.error('Không thể tải dữ liệu, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      archived: 'bg-gray-100 text-gray-500',
    };
    const labels = {
      draft: 'Nháp',
      active: 'Đang hoạt động',
      expired: 'Hết hạn',
      archived: 'Lưu trữ',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100'} variant="secondary">
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="pricing-management-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý giá</h1>
          <p className="text-gray-500">Chính sách giá, PTTT & Khuyến mãi</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chính sách giá</p>
                <p className="text-2xl font-bold">{pricingPolicies.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Phương thức TT</p>
                <p className="text-2xl font-bold">{paymentPlans.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Khuyến mãi</p>
                <p className="text-2xl font-bold">{promotions.length}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="policies">
            <DollarSign className="h-4 w-4 mr-2" />
            Chính sách giá ({pricingPolicies.length})
          </TabsTrigger>
          <TabsTrigger value="plans">
            <CreditCard className="h-4 w-4 mr-2" />
            PTTT ({paymentPlans.length})
          </TabsTrigger>
          <TabsTrigger value="promos">
            <Gift className="h-4 w-4 mr-2" />
            Khuyến mãi ({promotions.length})
          </TabsTrigger>
        </TabsList>

        {/* Pricing Policies Tab */}
        <TabsContent value="policies" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Chính sách giá</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm chính sách
            </Button>
          </div>
          
          {pricingPolicies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có chính sách giá nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricingPolicies.map((policy) => (
                <Card key={policy.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(policy.status)}
                      <span className="text-sm text-gray-500">{policy.code}</span>
                    </div>
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{policy.project_name || 'Tất cả dự án'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatDate(policy.effective_from)} - {formatDate(policy.effective_to) || 'Không giới hạn'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-gray-400" />
                        <span>Giảm tối đa: {policy.max_discount_percent}%</span>
                      </div>
                    </div>
                    
                    {policy.adjustments && policy.adjustments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Điều chỉnh giá:</p>
                        <div className="flex flex-wrap gap-1">
                          {policy.adjustments.map((adj, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {adj.type}: {adj.adjustment_value}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payment Plans Tab */}
        <TabsContent value="plans" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Phương thức thanh toán</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm PTTT
            </Button>
          </div>
          
          {paymentPlans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có phương thức thanh toán nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentPlans.map((plan) => {
                const typeConfig = paymentPlanTypes[plan.plan_type] || {};
                return (
                  <Card key={plan.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-100 text-blue-700" variant="secondary">
                          {typeConfig.label || plan.plan_type}
                        </Badge>
                        {getStatusBadge(plan.status)}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{plan.project_name || 'Tất cả dự án'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">
                            Chiết khấu: {plan.discount_percent}%
                          </span>
                        </div>
                      </div>
                      
                      {plan.milestones && plan.milestones.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">Tiến độ thanh toán:</p>
                          <div className="space-y-1">
                            {plan.milestones.map((m, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span>{m.name}</span>
                                <span className="font-medium">{m.percent}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promos" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Khuyến mãi</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm khuyến mãi
            </Button>
          </div>
          
          {promotions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có khuyến mãi nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map((promo) => (
                <Card key={promo.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(promo.status)}
                      <span className="text-sm text-gray-500">{promo.code}</span>
                    </div>
                    <CardTitle className="text-lg">{promo.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-500" />
                        <span className="text-purple-600 font-medium">
                          {promo.discount_type === 'percent' 
                            ? `Giảm ${promo.discount_value}%`
                            : `Giảm ${promo.discount_value?.toLocaleString('vi-VN')} đ`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                        </span>
                      </div>
                      {promo.max_uses && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span>
                            Đã dùng: {promo.current_uses || 0}/{promo.max_uses}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {promo.description && (
                      <p className="mt-2 text-xs text-gray-500">{promo.description}</p>
                    )}
                    
                    <div className="mt-3 flex items-center gap-2">
                      {promo.stackable && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Cộng dồn
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
