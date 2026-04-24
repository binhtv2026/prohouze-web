/**
 * Deal Pipeline Page - Prompt 8/20
 * 14-stage deal pipeline with drag & drop
 * UPDATED: Using Dynamic Form Renderer (Prompt 3/20 Phase 4)
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dealsAPI } from '@/lib/crmApi';
import { salesConfigApi } from '@/lib/salesApi';
import { 
  Plus, 
  Search, 
  Filter,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  User,
  ChevronRight,
  MoreHorizontal,
  Brain,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { AIDealInsightPanel } from '@/components/ai';
import { DealFormModal } from '@/components/forms/DealFormModal';

const DEMO_STAGES = [
  { code: 'lead', label: 'Lead', probability: 10, color: 'bg-slate-100 text-slate-700' },
  { code: 'consulting', label: 'Tư vấn', probability: 30, color: 'bg-blue-100 text-blue-700' },
  { code: 'booking', label: 'Booking', probability: 60, color: 'bg-amber-100 text-amber-700' },
  { code: 'closed', label: 'Chốt', probability: 100, color: 'bg-green-100 text-green-700' },
];
const DEMO_PIPELINE_STAGES = DEMO_STAGES.map(({ code, label, probability }) => ({ code, label, probability }));
const DEMO_DEALS = [
  { id: 'deal-demo-1', contact_name: 'Nguyễn Thành Long', code: 'DL-001', project_name: 'Rivera', estimated_value: 3200000000, assigned_to_name: 'Nguyễn Minh Anh', stage: 'lead' },
  { id: 'deal-demo-2', contact_name: 'Phạm Hương Giang', code: 'DL-002', project_name: 'Sunrise', estimated_value: 2850000000, assigned_to_name: 'Trần Quốc Huy', stage: 'consulting' },
  { id: 'deal-demo-3', contact_name: 'Lê Hoàng Việt', code: 'DL-003', project_name: 'Skyline', estimated_value: 4100000000, assigned_to_name: 'Lê Thanh Hà', stage: 'booking' },
  { id: 'deal-demo-4', contact_name: 'Đỗ Minh Khang', code: 'DL-004', project_name: 'Rivera', estimated_value: 3650000000, assigned_to_name: 'Nguyễn Minh Anh', stage: 'closed' },
];

export default function DealPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([]);
  const [pipelineStages, setPipelineStages] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [draggedDeal, setDraggedDeal] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dealsResponse, stagesData] = await Promise.all([
        dealsAPI.getAll({ limit: 100 }),
        salesConfigApi.getDealStages(),
      ]);
      
      // API v2 returns { data: [...], meta: {...} }
      const dealsData = dealsResponse.data || dealsResponse || [];
      
      setDeals(Array.isArray(dealsData) && dealsData.length > 0 ? dealsData : DEMO_DEALS);
      setStages(stagesData?.stages?.length ? stagesData.stages : DEMO_STAGES);
      setPipelineStages(stagesData?.pipeline_stages?.length ? stagesData.pipeline_stages : DEMO_PIPELINE_STAGES);
    } catch (err) {
      console.error('Failed to load data:', err);
      setDeals(DEMO_DEALS);
      setStages(DEMO_STAGES);
      setPipelineStages(DEMO_PIPELINE_STAGES);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value) => {
    if (!value) return '0';
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(0)}tr`;
    return value.toLocaleString('vi-VN');
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.stage === targetStage) {
      setDraggedDeal(null);
      return;
    }

    try {
      await dealsAPI.moveStage(draggedDeal.id, targetStage);
      
      // Update local state
      setDeals(deals.map(d => 
        d.id === draggedDeal.id ? { ...d, stage: targetStage } : d
      ));
      
      toast.success('Đã chuyển stage');
    } catch (err) {
      console.error('Failed to change stage:', err);
      toast.error('Không thể chuyển stage');
    } finally {
      setDraggedDeal(null);
    }
  };

  const filteredDeals = deals.filter(deal => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      deal.contact_name?.toLowerCase().includes(s) ||
      deal.code?.toLowerCase().includes(s) ||
      deal.project_name?.toLowerCase().includes(s)
    );
  });

  const getDealsForStage = (stageCode) => {
    return filteredDeals.filter(d => d.stage === stageCode);
  };

  const getStageConfig = (code) => {
    return stages.find(s => s.code === code) || {};
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="deal-pipeline-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Deal Pipeline</h1>
          <p className="text-gray-500">14-stage sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm deal..."
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="deal-search"
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)} data-testid="create-deal-btn">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {pipelineStages.map((stage) => {
            const config = getStageConfig(stage.code);
            const stageDeals = getDealsForStage(stage.code);
            const totalValue = stageDeals.reduce((sum, d) => sum + (d.estimated_value || 0), 0);
            
            return (
              <div
                key={stage.code}
                className="w-72 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.code)}
                data-testid={`stage-column-${stage.code}`}
              >
                {/* Stage Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={config.color || 'bg-gray-100'} variant="secondary">
                      {config.label || stage.code}
                    </Badge>
                    <span className="text-sm text-gray-500">{config.probability || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm text-gray-600">
                    <span>{stageDeals.length} deals</span>
                    <span>{formatCurrency(totalValue)}</span>
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="space-y-2 min-h-[200px] bg-gray-50 rounded-lg p-2">
                  {stageDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      className="cursor-move hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onClick={() => {
                        setSelectedDeal(deal);
                        setShowDealModal(true);
                      }}
                      data-testid={`deal-card-${deal.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{deal.contact_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 truncate">{deal.code || 'NEW'}</p>
                          </div>
                          <MoreHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          {deal.project_name && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Building className="h-3 w-3 mr-1" />
                              <span className="truncate">{deal.project_name}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span>{formatCurrency(deal.estimated_value)}</span>
                          </div>
                        </div>

                        {deal.assigned_to_name && (
                          <div className="mt-2 flex items-center">
                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-1">
                              <User className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-xs text-gray-500 truncate">{deal.assigned_to_name}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Kéo deal vào đây
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Detail Modal */}
      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Chi tiết Deal
            </DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              {/* AI Deal Insight Panel - Phase 3 */}
              <AIDealInsightPanel 
                dealId={selectedDeal.id}
                onActionComplete={loadData}
              />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedDeal.contact_name}</h3>
                  <p className="text-sm text-gray-500">{selectedDeal.code}</p>
                </div>
                <Badge className={selectedDeal.stage_color}>{selectedDeal.stage_label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dự án</p>
                  <p className="font-medium">{selectedDeal.project_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giá trị</p>
                  <p className="font-medium">{formatCurrency(selectedDeal.estimated_value)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Xác suất</p>
                  <p className="font-medium">{selectedDeal.probability}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người phụ trách</p>
                  <p className="font-medium">{selectedDeal.assigned_to_name || 'Chưa giao'}</p>
                </div>
              </div>

              {selectedDeal.contact_phone && (
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    {selectedDeal.contact_phone}
                  </Button>
                </div>
              )}

              {selectedDeal.notes && (
                <div>
                  <p className="text-sm text-gray-500">Ghi chú</p>
                  <p className="text-sm">{selectedDeal.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDealModal(false)}>Đóng</Button>
            <Button 
              variant="outline"
              onClick={() => {
                setEditingDeal(selectedDeal);
                setShowEditModal(true);
                setShowDealModal(false);
              }}
              data-testid="edit-deal-btn"
            >
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Deal Modal - Using Dynamic Form */}
      <DealFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        deal={null}
        onSuccess={loadData}
      />
      
      <DealFormModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) setEditingDeal(null);
        }}
        deal={editingDeal}
        onSuccess={loadData}
      />
    </div>
  );
}
