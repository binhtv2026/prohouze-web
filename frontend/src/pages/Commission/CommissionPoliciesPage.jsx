/**
 * Commission Policy Management
 * Prompt 11/20 - Commission Engine
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Plus, Settings, Percent, Users, Calendar, 
  CheckCircle, XCircle, Edit, Trash2, Copy, Eye
} from 'lucide-react';
import { listPolicies, createPolicy, activatePolicy, deactivatePolicy, getTriggers, getSplitTypes } from '../../api/commissionApi';
import { toast } from 'sonner';

const DEMO_TRIGGERS = [
  { value: 'booking_confirmed', label: 'Xác nhận booking' },
  { value: 'contract_signed', label: 'Ký hợp đồng' },
  { value: 'payment_completed', label: 'Thanh toán hoàn tất' },
];

const DEMO_SPLIT_TYPES = [
  { value: 'closing_sales', label: 'Sales chốt khách' },
  { value: 'team_leader', label: 'Trưởng nhóm' },
  { value: 'branch_manager', label: 'Quản lý chi nhánh' },
  { value: 'support_role', label: 'Vai trò hỗ trợ' },
  { value: 'company_pool', label: 'Quỹ công ty' },
];

const DEMO_POLICIES = [
  {
    id: 'policy-1',
    name: 'Chính sách bán hàng tiêu chuẩn',
    code: 'STANDARD-2026',
    status: 'active',
    status_label: 'Đang hoạt động',
    version: 3,
    brokerage_rate_value: 2,
    effective_from: '2026-01-01',
    split_rules: [
      { split_type: 'closing_sales', calc_value: 70 },
      { split_type: 'team_leader', calc_value: 10 },
      { split_type: 'branch_manager', calc_value: 5 },
      { split_type: 'company_pool', calc_value: 15 },
    ],
  },
  {
    id: 'policy-2',
    name: 'Chính sách thưởng nóng chiến dịch',
    code: 'HOTCAMPAIGN-2026',
    status: 'draft',
    status_label: 'Nháp',
    version: 1,
    brokerage_rate_value: 2.5,
    effective_from: '2026-03-01',
    split_rules: [
      { split_type: 'closing_sales', calc_value: 75 },
      { split_type: 'team_leader', calc_value: 10 },
      { split_type: 'company_pool', calc_value: 15 },
    ],
  },
];

// Format currency
const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

export default function CommissionPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [splitTypes, setSplitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope_type: 'global',
    brokerage_rate_type: 'percent',
    brokerage_rate_value: 2.0,
    trigger_event: 'contract_signed',
    estimated_trigger: 'booking_confirmed',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    requires_approval_above: 50000000,
    split_rules: [
      { split_type: 'closing_sales', calc_type: 'percent_of_brokerage', calc_value: 70, recipient_source: 'deal_owner', recipient_role: 'sales' },
      { split_type: 'team_leader', calc_type: 'percent_of_brokerage', calc_value: 10, recipient_source: 'team_leader', recipient_role: 'team_leader' },
      { split_type: 'branch_manager', calc_type: 'percent_of_brokerage', calc_value: 5, recipient_source: 'branch_manager', recipient_role: 'branch_manager' },
      { split_type: 'support_role', calc_type: 'percent_of_brokerage', calc_value: 5, recipient_source: 'manual', recipient_role: 'support' },
      { split_type: 'company_pool', calc_type: 'percent_of_brokerage', calc_value: 10, recipient_source: 'company', recipient_role: 'company' },
    ],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [policiesData, triggersData, splitTypesData] = await Promise.all([
        listPolicies({ status: activeTab === 'all' ? '' : activeTab }),
        getTriggers(),
        getSplitTypes(),
      ]);
      setPolicies(Array.isArray(policiesData) && policiesData.length > 0 ? policiesData : DEMO_POLICIES);
      setTriggers(Array.isArray(triggersData) && triggersData.length > 0 ? triggersData : DEMO_TRIGGERS);
      setSplitTypes(Array.isArray(splitTypesData) && splitTypesData.length > 0 ? splitTypesData : DEMO_SPLIT_TYPES);
    } catch (error) {
      console.error('Error loading data:', error);
      setPolicies(DEMO_POLICIES);
      setTriggers(DEMO_TRIGGERS);
      setSplitTypes(DEMO_SPLIT_TYPES);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePolicy = async () => {
    try {
      // Validate total split = 100%
      const totalSplit = formData.split_rules.reduce((sum, r) => sum + r.calc_value, 0);
      if (totalSplit !== 100) {
        toast.error(`Tổng split phải bằng 100% (hiện tại: ${totalSplit}%)`);
        return;
      }

      await createPolicy(formData);
      toast.success('Tạo chính sách thành công');
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      toast.error('Lỗi tạo chính sách');
    }
  };

  const handleActivate = async (policyId) => {
    try {
      await activatePolicy(policyId);
      toast.success('Kích hoạt chính sách thành công');
      loadData();
    } catch (error) {
      toast.error('Lỗi kích hoạt chính sách');
    }
  };

  const handleDeactivate = async (policyId) => {
    try {
      await deactivatePolicy(policyId);
      toast.success('Vô hiệu hóa chính sách thành công');
      loadData();
    } catch (error) {
      toast.error('Lỗi vô hiệu hóa chính sách');
    }
  };

  const updateSplitRule = (index, field, value) => {
    const newRules = [...formData.split_rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setFormData({ ...formData, split_rules: newRules });
  };

  const totalSplitPercent = formData.split_rules.reduce((sum, r) => sum + (r.calc_value || 0), 0);

  return (
    <div className="p-6 space-y-6" data-testid="commission-policies-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chính sách Hoa hồng</h1>
          <p className="text-gray-500 mt-1">Quản lý quy tắc tính và chia hoa hồng</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} data-testid="create-policy-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tạo chính sách
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="draft">Nháp</TabsTrigger>
          <TabsTrigger value="inactive">Vô hiệu</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : policies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Chưa có chính sách nào</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo chính sách đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {policies.map((policy) => (
                <Card key={policy.id} className="hover:shadow-md transition-shadow" data-testid={`policy-${policy.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{policy.name}</h3>
                          <Badge variant={policy.status === 'active' ? 'default' : 'outline'} 
                                 className={policy.status === 'active' ? 'bg-green-500' : ''}>
                            {policy.status_label}
                          </Badge>
                          <span className="text-sm text-gray-400">v{policy.version}</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{policy.code}</p>
                        
                        <div className="flex items-center gap-6 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-blue-500" />
                            <span>Phí MG: {policy.brokerage_rate_value}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <span>{policy.split_rules?.length || 0} splits</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span>Từ: {new Date(policy.effective_from).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        {/* Split rules preview */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {policy.split_rules?.slice(0, 4).map((rule, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {splitTypes.find(s => s.value === rule.split_type)?.label || rule.split_type}: {rule.calc_value}%
                            </Badge>
                          ))}
                          {policy.split_rules?.length > 4 && (
                            <Badge variant="outline" className="text-xs">+{policy.split_rules.length - 4}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Sao chép">
                          <Copy className="w-4 h-4" />
                        </Button>
                        {policy.status === 'draft' && (
                          <Button variant="outline" size="sm" onClick={() => handleActivate(policy.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Kích hoạt
                          </Button>
                        )}
                        {policy.status === 'active' && (
                          <Button variant="outline" size="sm" onClick={() => handleDeactivate(policy.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Vô hiệu
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Policy Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo chính sách Hoa hồng mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tên chính sách *</Label>
                <Input 
                  placeholder="VD: Chính sách HH Dự án ABC"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Mô tả</Label>
                <Input 
                  placeholder="Mô tả ngắn về chính sách"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Brokerage Rate */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Phí môi giới (Brokerage)</CardTitle>
                <CardDescription>Tỷ lệ hoa hồng từ CĐT cho sàn phân phối</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Loại tính</Label>
                    <Select 
                      value={formData.brokerage_rate_type}
                      onValueChange={(v) => setFormData({ ...formData, brokerage_rate_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Phần trăm (%)</SelectItem>
                        <SelectItem value="fixed">Số tiền cố định</SelectItem>
                        <SelectItem value="tiered">Theo bậc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Giá trị</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        step="0.1"
                        value={formData.brokerage_rate_value}
                        onChange={(e) => setFormData({ ...formData, brokerage_rate_value: parseFloat(e.target.value) })}
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Split Rules */}
            <Card className={`border-2 ${totalSplitPercent === 100 ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Chia hoa hồng (Split Rules)</span>
                  <div className="flex items-center gap-2">
                    {totalSplitPercent !== 100 && (
                      <span className="text-xs text-red-600 font-normal">
                        {totalSplitPercent > 100 ? `Vượt ${totalSplitPercent - 100}%` : `Thiếu ${100 - totalSplitPercent}%`}
                      </span>
                    )}
                    <Badge 
                      variant={totalSplitPercent === 100 ? 'default' : 'destructive'} 
                      className={`text-sm px-3 py-1 ${totalSplitPercent === 100 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
                    >
                      {totalSplitPercent === 100 ? '✓ ' : '⚠ '}Tổng: {totalSplitPercent}%
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  Phân chia hoa hồng cho các vai trò. 
                  <strong className={totalSplitPercent === 100 ? 'text-green-600' : 'text-red-600'}>
                    {' '}Tổng PHẢI = 100%
                  </strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Warning banner if not 100% */}
                {totalSplitPercent !== 100 && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Tổng tỷ lệ chia không hợp lệ!</p>
                      <p className="text-sm">Tổng hiện tại: {totalSplitPercent}% — Cần điều chỉnh {totalSplitPercent > 100 ? 'giảm' : 'thêm'} {Math.abs(100 - totalSplitPercent)}%</p>
                    </div>
                  </div>
                )}
                
                {/* Split summary */}
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Tóm tắt chia</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.split_rules.map((rule, idx) => {
                      const label = splitTypes.find(s => s.value === rule.split_type)?.label || rule.split_type;
                      return (
                        <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {label}: <strong>{rule.calc_value}%</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {formData.split_rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <Select 
                        value={rule.split_type}
                        onValueChange={(v) => updateSplitRule(idx, 'split_type', v)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {splitTypes.map((st) => (
                            <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <Input 
                          type="number"
                          className="w-20"
                          value={rule.calc_value}
                          onChange={(e) => updateSplitRule(idx, 'calc_value', parseFloat(e.target.value))}
                        />
                        <span className="text-gray-500">%</span>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          const newRules = formData.split_rules.filter((_, i) => i !== idx);
                          setFormData({ ...formData, split_rules: newRules });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        split_rules: [...formData.split_rules, {
                          split_type: 'support_role',
                          calc_type: 'percent_of_brokerage',
                          calc_value: 0,
                          recipient_source: 'manual',
                          recipient_role: 'support'
                        }]
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm split
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trigger & Approval */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger tính HH chính</Label>
                <Select 
                  value={formData.trigger_event}
                  onValueChange={(v) => setFormData({ ...formData, trigger_event: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggers.filter(t => t.requires_contract).map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trigger ước tính</Label>
                <Select 
                  value={formData.estimated_trigger}
                  onValueChange={(v) => setFormData({ ...formData, estimated_trigger: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggers.filter(t => t.creates_estimated).map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ngày hiệu lực từ</Label>
                <Input 
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Cần duyệt từ (VND)</Label>
                <Input 
                  type="number"
                  value={formData.requires_approval_above}
                  onChange={(e) => setFormData({ ...formData, requires_approval_above: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
            <Button 
              onClick={handleCreatePolicy} 
              disabled={totalSplitPercent !== 100 || !formData.name}
              className={totalSplitPercent !== 100 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {totalSplitPercent !== 100 ? `Tổng ≠ 100% (${totalSplitPercent}%)` : 'Tạo chính sách'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
