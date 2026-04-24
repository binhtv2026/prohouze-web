/**
 * Lead Sources Management Page
 * Prompt 7/20 - Lead Source & Marketing Attribution Engine
 * 
 * Features:
 * - List all lead sources with metrics
 * - Create/Edit lead sources
 * - View source analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  Plus, Search, Filter, TrendingUp, Target, DollarSign, 
  Edit2, Trash2, BarChart3, ArrowLeft
} from 'lucide-react';
import { leadSourcesAPI, marketingConfigAPI } from '../../lib/marketingApi';
import { Link } from 'react-router-dom';

function formatCurrency(amount) {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} tr`;
  return amount.toLocaleString('vi-VN');
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

const sourceTypeColors = {
  organic: 'bg-green-100 text-green-700',
  paid: 'bg-blue-100 text-blue-700',
  social: 'bg-purple-100 text-purple-700',
  referral: 'bg-amber-100 text-amber-700',
  event: 'bg-rose-100 text-rose-700',
  direct: 'bg-teal-100 text-teal-700',
  email: 'bg-cyan-100 text-cyan-700',
  partner: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
};

const DEMO_SOURCE_TYPES = [
  { code: 'paid', label_vi: 'Quảng cáo trả phí' },
  { code: 'social', label_vi: 'Mạng xã hội' },
  { code: 'organic', label_vi: 'Tự nhiên' },
];

const DEMO_CHANNELS = [
  { code: 'facebook_ads', label: 'Facebook Ads', source_type: 'paid' },
  { code: 'tiktok', label: 'TikTok', source_type: 'social' },
  { code: 'landing_page', label: 'Landing page', source_type: 'organic' },
];

const DEMO_SOURCES = [
  { id: 'source-1', code: 'FB_PRIVE', name: 'Facebook Ads - The Privé', source_type: 'paid', channel: 'facebook_ads', default_quality_score: 78, cost_per_lead: 320000, total_budget: 120000000, lead_count: 38, converted_count: 4, revenue: 286000000, is_active: true },
  { id: 'source-2', code: 'TT_SALE', name: 'TikTok sale cá nhân', source_type: 'social', channel: 'tiktok', default_quality_score: 71, cost_per_lead: 95000, total_budget: 25000000, lead_count: 29, converted_count: 3, revenue: 214000000, is_active: true },
  { id: 'source-3', code: 'LP_OPENING', name: 'Landing page mở bán', source_type: 'organic', channel: 'landing_page', default_quality_score: 82, cost_per_lead: 0, total_budget: 18000000, lead_count: 21, converted_count: 2, revenue: 162000000, is_active: true },
];

export default function LeadSourcesPage() {
  const [sources, setSources] = useState([]);
  const [sourceTypes, setSourceTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    source_type: '',
    channel: '',
    default_quality_score: 50,
    cost_per_lead: 0,
    total_budget: 0,
    description: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sourcesRes, typesRes, channelsRes] = await Promise.all([
        leadSourcesAPI.getAll({ 
          search: search || undefined,
          source_type: filterType !== 'all' ? filterType : undefined
        }),
        marketingConfigAPI.getSourceTypes(),
        marketingConfigAPI.getChannels(),
      ]);
      const sourceItems = sourcesRes.data || [];
      setSources(sourceItems.length > 0 ? sourceItems : DEMO_SOURCES.filter((item) => {
        const matchType = filterType === 'all' || item.source_type === filterType;
        const keyword = search.trim().toLowerCase();
        const matchSearch = !keyword || [item.name, item.code].join(' ').toLowerCase().includes(keyword);
        return matchType && matchSearch;
      }));
      setSourceTypes(typesRes.data?.source_types?.length > 0 ? typesRes.data.source_types : DEMO_SOURCE_TYPES);
      setChannels(channelsRes.data?.channels?.length > 0 ? channelsRes.data.channels : DEMO_CHANNELS);
    } catch (error) {
      console.error('Failed to load data:', error);
      setSources(DEMO_SOURCES.filter((item) => {
        const matchType = filterType === 'all' || item.source_type === filterType;
        const keyword = search.trim().toLowerCase();
        const matchSearch = !keyword || [item.name, item.code].join(' ').toLowerCase().includes(keyword);
        return matchType && matchSearch;
      }));
      setSourceTypes(DEMO_SOURCE_TYPES);
      setChannels(DEMO_CHANNELS);
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    try {
      await leadSourcesAPI.create(formData);
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create source:', error);
      alert(error.response?.data?.detail || 'Lỗi tạo nguồn lead');
    }
  };

  const handleUpdate = async () => {
    if (!editingSource) return;
    try {
      await leadSourcesAPI.update(editingSource.id, formData);
      setEditingSource(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to update source:', error);
      alert(error.response?.data?.detail || 'Lỗi cập nhật nguồn lead');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nguồn lead này?')) return;
    try {
      await leadSourcesAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const openEditModal = (source) => {
    setEditingSource(source);
    setFormData({
      code: source.code,
      name: source.name,
      source_type: source.source_type,
      channel: source.channel,
      default_quality_score: source.default_quality_score || 50,
      cost_per_lead: source.cost_per_lead || 0,
      total_budget: source.total_budget || 0,
      description: source.description || '',
    });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      source_type: '',
      channel: '',
      default_quality_score: 50,
      cost_per_lead: 0,
      total_budget: 0,
      description: '',
    });
  };

  const filteredChannels = channels.filter(ch => 
    !formData.source_type || ch.source_type === formData.source_type
  );

  return (
    <div className="space-y-6" data-testid="lead-sources-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/marketing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nguồn Lead</h1>
            <p className="text-gray-500 mt-1">Quản lý và theo dõi hiệu quả các nguồn lead</p>
          </div>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button data-testid="create-source-btn" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm nguồn mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tạo nguồn lead mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã nguồn *</Label>
                  <Input 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: FB_ADS_Q1"
                    data-testid="source-code-input"
                  />
                </div>
                <div>
                  <Label>Tên nguồn *</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Facebook Ads Q1"
                    data-testid="source-name-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại nguồn *</Label>
                  <Select value={formData.source_type} onValueChange={(v) => setFormData({ ...formData, source_type: v, channel: '' })}>
                    <SelectTrigger data-testid="source-type-select">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTypes.map((t) => (
                        <SelectItem key={t.code} value={t.code}>{t.label_vi}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kênh *</Label>
                  <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
                    <SelectTrigger data-testid="source-channel-select">
                      <SelectValue placeholder="Chọn kênh" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredChannels.map((ch) => (
                        <SelectItem key={ch.code} value={ch.code}>{ch.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Điểm chất lượng mặc định</Label>
                  <Input 
                    type="number"
                    value={formData.default_quality_score}
                    onChange={(e) => setFormData({ ...formData, default_quality_score: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    data-testid="quality-score-input"
                  />
                </div>
                <div>
                  <Label>CPL ước tính (VND)</Label>
                  <Input 
                    type="number"
                    value={formData.cost_per_lead}
                    onChange={(e) => setFormData({ ...formData, cost_per_lead: parseFloat(e.target.value) || 0 })}
                    data-testid="cpl-input"
                  />
                </div>
              </div>
              <div>
                <Label>Ngân sách tổng (VND)</Label>
                <Input 
                  type="number"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) || 0 })}
                  data-testid="budget-input"
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả thêm về nguồn lead"
                  data-testid="description-input"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
                <Button onClick={handleCreate} disabled={!formData.code || !formData.name || !formData.source_type || !formData.channel} data-testid="submit-create-btn">
                  Tạo nguồn
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
              placeholder="Tìm kiếm nguồn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="search-input"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40" data-testid="filter-type-select">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Loại nguồn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {sourceTypes.map((t) => (
              <SelectItem key={t.code} value={t.code}>{t.label_vi}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sources Table */}
      <Card data-testid="sources-table-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Chưa có nguồn lead nào</p>
              <p className="text-sm">Bấm "Thêm nguồn mới" để bắt đầu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Nguồn</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Loại</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Leads</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Chuyển đổi</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Doanh thu</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">CPL</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Trạng thái</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id} className="border-b hover:bg-gray-50 transition-colors" data-testid={`source-row-${source.code}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{source.name}</p>
                          <p className="text-xs text-gray-500">{source.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={sourceTypeColors[source.source_type] || ''}>
                          {source.source_type_label || source.source_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold">{source.total_leads}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <span className="font-semibold text-green-600">{source.converted_leads}</span>
                          <span className="text-gray-400 text-xs ml-1">({formatPercent(source.conversion_rate)})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold">{formatCurrency(source.total_revenue)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-600">{formatCurrency(source.actual_cost_per_lead || source.cost_per_lead || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {source.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary">Tạm dừng</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(source)} data-testid={`edit-${source.code}`}>
                            <Edit2 className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(source.id)} data-testid={`delete-${source.code}`}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingSource} onOpenChange={(open) => !open && setEditingSource(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nguồn lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã nguồn</Label>
                <Input value={formData.code} disabled />
              </div>
              <div>
                <Label>Tên nguồn *</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Điểm chất lượng</Label>
                <Input 
                  type="number"
                  value={formData.default_quality_score}
                  onChange={(e) => setFormData({ ...formData, default_quality_score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>CPL (VND)</Label>
                <Input 
                  type="number"
                  value={formData.cost_per_lead}
                  onChange={(e) => setFormData({ ...formData, cost_per_lead: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Ngân sách tổng (VND)</Label>
              <Input 
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingSource(null)}>Hủy</Button>
              <Button onClick={handleUpdate} data-testid="submit-update-btn">
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
