/**
 * Campaigns Management Page
 * Prompt 7/20 - Lead Source & Marketing Attribution Engine
 * 
 * Features:
 * - List all campaigns with metrics
 * - Create/Edit campaigns
 * - View campaign status and progress
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { 
  Plus, Search, Filter, Megaphone, Target, DollarSign, 
  Edit2, Calendar, Play, Pause, CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';
import { campaignsAPI, marketingConfigAPI } from '../../lib/marketingApi';
import { Link } from 'react-router-dom';

function formatCurrency(amount) {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} tr`;
  return amount.toLocaleString('vi-VN');
}

function formatPercent(value) {
  return `${(value || 0).toFixed(1)}%`;
}

const statusConfig = {
  draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-700', icon: Edit2 },
  scheduled: { label: 'Đã lên lịch', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  active: { label: 'Đang chạy', color: 'bg-green-100 text-green-700', icon: Play },
  paused: { label: 'Tạm dừng', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
  completed: { label: 'Hoàn thành', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const DEMO_CAMPAIGN_TYPES = [
  { code: 'lead_generation', label_vi: 'Tạo lead' },
  { code: 'branding', label_vi: 'Nhận diện thương hiệu' },
  { code: 'retargeting', label_vi: 'Remarketing' },
];

const DEMO_CAMPAIGN_STATUSES = [
  { code: 'draft', label_vi: 'Nháp' },
  { code: 'active', label_vi: 'Đang chạy' },
  { code: 'paused', label_vi: 'Tạm dừng' },
  { code: 'completed', label_vi: 'Hoàn thành' },
];

const DEMO_CAMPAIGNS = [
  { id: 'camp-1', code: 'CAMP-2026-101', name: 'Push opening The Privé', campaign_type: 'lead_generation', status: 'active', budget_total: 120000000, actual_spend: 84000000, target_leads: 60, actual_leads: 42, target_conversions: 6, actual_conversions: 4, target_revenue: 350000000, actual_revenue: 286000000, start_date: '2026-03-01', end_date: '2026-03-31' },
  { id: 'camp-2', code: 'CAMP-2026-102', name: 'TikTok hàng ngon tháng 3', campaign_type: 'retargeting', status: 'active', budget_total: 60000000, actual_spend: 37000000, target_leads: 40, actual_leads: 27, target_conversions: 4, actual_conversions: 3, target_revenue: 250000000, actual_revenue: 214000000, start_date: '2026-03-10', end_date: '2026-03-30' },
  { id: 'camp-3', code: 'CAMP-2026-099', name: 'Branding dự án Glory Heights', campaign_type: 'branding', status: 'paused', budget_total: 45000000, actual_spend: 18000000, target_leads: 20, actual_leads: 9, target_conversions: 2, actual_conversions: 1, target_revenue: 120000000, actual_revenue: 68000000, start_date: '2026-02-20', end_date: '2026-03-20' },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignTypes, setCampaignTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    campaign_type: 'lead_generation',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget_total: 0,
    target_leads: 0,
    target_conversions: 0,
    target_revenue: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [campaignsRes, typesRes, statusesRes] = await Promise.all([
        campaignsAPI.getAll({ 
          search: search || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined
        }),
        marketingConfigAPI.getCampaignTypes(),
        marketingConfigAPI.getCampaignStatuses(),
      ]);
      const keyword = search.trim().toLowerCase();
      const fallbackCampaigns = DEMO_CAMPAIGNS.filter((item) => {
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchSearch = !keyword || [item.name, item.code].join(' ').toLowerCase().includes(keyword);
        return matchStatus && matchSearch;
      });
      setCampaigns(campaignsRes.data?.length > 0 ? campaignsRes.data : fallbackCampaigns);
      setCampaignTypes(typesRes.data?.campaign_types?.length > 0 ? typesRes.data.campaign_types : DEMO_CAMPAIGN_TYPES);
      setStatuses(statusesRes.data?.statuses?.length > 0 ? statusesRes.data.statuses : DEMO_CAMPAIGN_STATUSES);
    } catch (error) {
      console.error('Failed to load data:', error);
      const keyword = search.trim().toLowerCase();
      setCampaigns(DEMO_CAMPAIGNS.filter((item) => {
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchSearch = !keyword || [item.name, item.code].join(' ').toLowerCase().includes(keyword);
        return matchStatus && matchSearch;
      }));
      setCampaignTypes(DEMO_CAMPAIGN_TYPES);
      setStatuses(DEMO_CAMPAIGN_STATUSES);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    try {
      await campaignsAPI.create({
        ...formData,
        budget_total: parseFloat(formData.budget_total) || 0,
        target_leads: parseInt(formData.target_leads) || 0,
        target_conversions: parseInt(formData.target_conversions) || 0,
        target_revenue: parseFloat(formData.target_revenue) || 0,
      });
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert(error.response?.data?.detail || 'Lỗi tạo chiến dịch');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await campaignsAPI.updateStatus(id, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      campaign_type: 'lead_generation',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      budget_total: 0,
      target_leads: 0,
      target_conversions: 0,
      target_revenue: 0,
    });
  };

  const generateCode = () => {
    const prefix = 'CAMP';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData({ ...formData, code: `${prefix}-${year}-${random}` });
  };

  return (
    <div className="space-y-6" data-testid="campaigns-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/marketing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chiến dịch Marketing</h1>
            <p className="text-gray-500 mt-1">Quản lý và theo dõi các chiến dịch marketing</p>
          </div>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button data-testid="create-campaign-btn" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo chiến dịch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tạo chiến dịch mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã chiến dịch *</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="CAMP-2026-001"
                      data-testid="campaign-code-input"
                    />
                    <Button variant="outline" size="icon" onClick={generateCode} type="button">
                      <Target className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Loại chiến dịch *</Label>
                  <Select value={formData.campaign_type} onValueChange={(v) => setFormData({ ...formData, campaign_type: v })}>
                    <SelectTrigger data-testid="campaign-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((t) => (
                        <SelectItem key={t.code} value={t.code}>{t.label_vi}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tên chiến dịch *</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Chiến dịch Tết 2026"
                  data-testid="campaign-name-input"
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết chiến dịch"
                  data-testid="campaign-desc-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày bắt đầu *</Label>
                  <Input 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    data-testid="start-date-input"
                  />
                </div>
                <div>
                  <Label>Ngày kết thúc</Label>
                  <Input 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    data-testid="end-date-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngân sách (VND)</Label>
                  <Input 
                    type="number"
                    value={formData.budget_total}
                    onChange={(e) => setFormData({ ...formData, budget_total: e.target.value })}
                    placeholder="500000000"
                    data-testid="budget-input"
                  />
                </div>
                <div>
                  <Label>Mục tiêu leads</Label>
                  <Input 
                    type="number"
                    value={formData.target_leads}
                    onChange={(e) => setFormData({ ...formData, target_leads: e.target.value })}
                    placeholder="1000"
                    data-testid="target-leads-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mục tiêu chuyển đổi</Label>
                  <Input 
                    type="number"
                    value={formData.target_conversions}
                    onChange={(e) => setFormData({ ...formData, target_conversions: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>Mục tiêu doanh thu (VND)</Label>
                  <Input 
                    type="number"
                    value={formData.target_revenue}
                    onChange={(e) => setFormData({ ...formData, target_revenue: e.target.value })}
                    placeholder="50000000000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!formData.code || !formData.name || !formData.start_date}
                  data-testid="submit-create-btn"
                >
                  Tạo chiến dịch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm chiến dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="search-input"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="filter-status-select">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Chưa có chiến dịch nào</p>
            <p className="text-sm">Bấm "Tạo chiến dịch" để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const StatusIcon = statusConfig[campaign.status]?.icon || Edit2;
            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow" data-testid={`campaign-card-${campaign.code}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <p className="text-xs text-gray-500">{campaign.code}</p>
                    </div>
                    <Badge className={statusConfig[campaign.status]?.color || ''}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {campaign.status_label || campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type & Timeline */}
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline">{campaign.campaign_type_label || campaign.campaign_type}</Badge>
                    <span className="text-gray-500">
                      {campaign.days_remaining !== null ? (
                        campaign.days_remaining >= 0 ? `${campaign.days_remaining} ngày còn lại` : 'Quá hạn'
                      ) : 'Không có hạn'}
                    </span>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Leads ({campaign.total_leads}/{campaign.target_leads || '∞'})</span>
                        <span className="font-medium">{formatPercent(campaign.leads_progress)}</span>
                      </div>
                      <Progress value={Math.min(campaign.leads_progress || 0, 100)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Ngân sách</span>
                        <span className="font-medium">{formatPercent(campaign.budget_progress)}</span>
                      </div>
                      <Progress value={Math.min(campaign.budget_progress || 0, 100)} className="h-2" />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{campaign.total_leads}</p>
                      <p className="text-xs text-gray-500">Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{formatPercent(campaign.conversion_rate)}</p>
                      <p className="text-xs text-gray-500">CVR</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(campaign.total_revenue)}</p>
                      <p className="text-xs text-gray-500">Doanh thu</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {campaign.status === 'draft' && (
                      <Button size="sm" className="flex-1" onClick={() => handleStatusChange(campaign.id, 'active')} data-testid={`activate-${campaign.code}`}>
                        <Play className="h-3 w-3 mr-1" /> Kích hoạt
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleStatusChange(campaign.id, 'paused')} data-testid={`pause-${campaign.code}`}>
                        <Pause className="h-3 w-3 mr-1" /> Tạm dừng
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button size="sm" className="flex-1" onClick={() => handleStatusChange(campaign.id, 'active')} data-testid={`resume-${campaign.code}`}>
                        <Play className="h-3 w-3 mr-1" /> Tiếp tục
                      </Button>
                    )}
                    {['active', 'paused'].includes(campaign.status) && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(campaign.id, 'completed')} data-testid={`complete-${campaign.code}`}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
