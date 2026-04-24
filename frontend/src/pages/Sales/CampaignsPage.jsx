import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Search,
  Calendar,
  Target,
  TrendingUp,
  Play,
  Pause,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
};

const DEMO_CAMPAIGNS = [
  { id: 'sales-campaign-1', name: 'Mở bán Rivera đợt 1', project_name: 'Rivera Residence', status: 'active', sold_units: 18, target_units: 45, actual_revenue: 52100000000, target_revenue: 128000000000, start_date: '2026-03-10', end_date: '2026-04-10' },
  { id: 'sales-campaign-2', name: 'Giữ chỗ Sunrise Premium', project_name: 'Sunrise Premium', status: 'paused', sold_units: 9, target_units: 30, actual_revenue: 28900000000, target_revenue: 92000000000, start_date: '2026-03-01', end_date: '2026-03-31' },
  { id: 'sales-campaign-3', name: 'Bùng nổ booking Skyline', project_name: 'Skyline Heights', status: 'draft', sold_units: 0, target_units: 25, actual_revenue: 0, target_revenue: 47000000000, start_date: '2026-04-01', end_date: '2026-04-30' },
];

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    project_id: '',
    start_date: '',
    end_date: '',
    target_units: 0,
    target_revenue: 0,
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/campaigns');
      setCampaigns(Array.isArray(res?.data) && res.data.length > 0 ? res.data : DEMO_CAMPAIGNS);
    } catch (error) {
      console.error('Error:', error);
      setCampaigns(DEMO_CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = async () => {
    try {
      await api.post('/sales/campaigns', form);
      toast.success('Tạo chiến dịch thành công!');
      setShowDialog(false);
      setForm({ name: '', description: '', project_id: '', start_date: '', end_date: '', target_units: 0, target_revenue: 0 });
      fetchCampaigns();
    } catch (error) {
      toast.error('Lỗi khi tạo chiến dịch');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await api.put(`/sales/campaigns/${id}`, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Đã kích hoạt chiến dịch' : 'Đã tạm dừng chiến dịch');
      fetchCampaigns();
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="campaigns-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chiến dịch mở bán</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các chiến dịch bán hàng</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="add-campaign-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo chiến dịch
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Tìm kiếm chiến dịch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Đang chạy</p>
                <p className="text-xl font-bold text-green-700">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Pause className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Tạm dừng</p>
                <p className="text-xl font-bold text-amber-700">
                  {campaigns.filter(c => c.status === 'paused').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Tổng căn bán</p>
                <p className="text-xl font-bold text-blue-700">
                  {campaigns.reduce((acc, c) => acc + (c.sold_units || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Doanh thu</p>
                <p className="text-xl font-bold text-purple-700">
                  {formatCurrency(campaigns.reduce((acc, c) => acc + (c.actual_revenue || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Chưa có chiến dịch nào</p>
            <Button variant="link" onClick={() => setShowDialog(true)}>
              Tạo chiến dịch đầu tiên
            </Button>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow" data-testid={`campaign-${campaign.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <p className="text-sm text-slate-500">{campaign.project_name}</p>
                  </div>
                  <Badge className={statusColors[campaign.status]}>
                    {campaign.status === 'active' ? 'Đang chạy' : 
                     campaign.status === 'paused' ? 'Tạm dừng' :
                     campaign.status === 'completed' ? 'Hoàn thành' : 'Nháp'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Tiến độ bán</span>
                      <span className="font-medium">
                        {campaign.sold_units || 0} / {campaign.target_units || 0}
                      </span>
                    </div>
                    <Progress 
                      value={campaign.target_units > 0 ? ((campaign.sold_units || 0) / campaign.target_units * 100) : 0} 
                      className="h-2"
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Doanh thu</p>
                      <p className="font-medium">{formatCurrency(campaign.actual_revenue || 0)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Mục tiêu</p>
                      <p className="font-medium">{formatCurrency(campaign.target_revenue || 0)}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {campaign.start_date && new Date(campaign.start_date).toLocaleDateString('vi-VN')}
                    {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString('vi-VN')}`}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Chi tiết
                    </Button>
                    {campaign.status !== 'completed' && (
                      <Button 
                        variant={campaign.status === 'active' ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                      >
                        {campaign.status === 'active' ? (
                          <><Pause className="h-4 w-4 mr-1" /> Dừng</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" /> Chạy</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo chiến dịch mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên chiến dịch *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Mở bán đợt 1 - Dự án ABC"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết chiến dịch..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ngày bắt đầu</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ngày kết thúc</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mục tiêu (căn)</label>
                <Input
                  type="number"
                  value={form.target_units}
                  onChange={(e) => setForm({ ...form, target_units: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mục tiêu doanh thu (VND)</label>
                <Input
                  type="number"
                  value={form.target_revenue}
                  onChange={(e) => setForm({ ...form, target_revenue: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.name}>
              Tạo chiến dịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
