/**
 * Sales Pipeline Kanban Board
 * TASK 4 - PART 1: SALES PIPELINE UI
 * 
 * Features:
 * - 9-stage Kanban board with drag & drop
 * - Card displays: customer name, product, value, status badge
 * - Quick actions: hold product, create booking
 * - Real-time inventory sync when changing stages
 * 
 * Stages: lead_new → contacted → interested → viewing → holding → booking → negotiating → closed_won/closed_lost
 */

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter,
  Building2,
  DollarSign,
  User,
  MoreVertical,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  GripVertical,
  Hand,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Package,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { pipelineApi } from '@/api/pipelineApi';

// Stage colors mapping
const STAGE_COLORS = {
  lead_new: 'bg-slate-100 text-slate-700 border-slate-300',
  contacted: 'bg-blue-100 text-blue-700 border-blue-300',
  interested: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  viewing: 'bg-purple-100 text-purple-700 border-purple-300',
  holding: 'bg-amber-100 text-amber-700 border-amber-300',
  booking: 'bg-orange-100 text-orange-700 border-orange-300',
  negotiating: 'bg-pink-100 text-pink-700 border-pink-300',
  closed_won: 'bg-green-100 text-green-700 border-green-300',
  closed_lost: 'bg-red-100 text-red-700 border-red-300',
};

const STAGE_ICONS = {
  lead_new: '🎯',
  contacted: '📞',
  interested: '💡',
  viewing: '👁️',
  holding: '✋',
  booking: '📝',
  negotiating: '🤝',
  closed_won: '🎉',
  closed_lost: '❌',
};

const DEMO_PIPELINE_STAGES = [
  { code: 'lead_new', label: 'Lead mới' },
  { code: 'contacted', label: 'Đã liên hệ' },
  { code: 'interested', label: 'Quan tâm' },
  { code: 'viewing', label: 'Đi xem' },
  { code: 'holding', label: 'Giữ chỗ' },
  { code: 'booking', label: 'Booking' },
  { code: 'negotiating', label: 'Đàm phán' },
  { code: 'closed_won', label: 'Thành công' },
  { code: 'closed_lost', label: 'Thất bại' },
];

const DEMO_KANBAN_DATA = {
  lead_new: { deals: [{ id: 'pk-1', customer_name: 'Nguyễn Thành Long', lead_name: 'Nguyễn Thành Long', product_name: 'Rivera A12', value: 3200000000, status: 'new' }], count: 1 },
  contacted: { deals: [{ id: 'pk-2', customer_name: 'Phạm Hương Giang', lead_name: 'Phạm Hương Giang', product_name: 'Sunrise B08', value: 2850000000, status: 'contacted' }], count: 1 },
  interested: { deals: [{ id: 'pk-3', customer_name: 'Lê Hoàng Việt', lead_name: 'Lê Hoàng Việt', product_name: 'Skyline C05', value: 1980000000, status: 'interested' }], count: 1 },
  viewing: { deals: [], count: 0 },
  holding: { deals: [{ id: 'pk-4', customer_name: 'Đỗ Minh Khang', lead_name: 'Đỗ Minh Khang', product_name: 'Rivera A15', value: 3650000000, status: 'holding' }], count: 1 },
  booking: { deals: [], count: 0 },
  negotiating: { deals: [], count: 0 },
  closed_won: { deals: [{ id: 'pk-5', customer_name: 'Hoàng Minh Đức', lead_name: 'Hoàng Minh Đức', product_name: 'Sunrise C12', value: 4120000000, status: 'closed_won' }], count: 1 },
  closed_lost: { deals: [], count: 0 },
};

const DEMO_PIPELINE_STATS = {
  total_deals: 5,
  total_value: 15800000000,
  won_count: 1,
  conversion_rate: 20,
};

export default function PipelineKanbanPage() {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [kanbanData, setKanbanData] = useState({});
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStageChangeModal, setShowStageChangeModal] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState(null);
  const [stageChangeNotes, setStageChangeNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // New deal form
  const [newDeal, setNewDeal] = useState({
    lead_name: '',
    lead_phone: '',
    lead_email: '',
    product_id: '',
    value: '',
    notes: '',
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [stagesRes, kanbanRes, statsRes] = await Promise.all([
        pipelineApi.getStages(),
        pipelineApi.getKanban(),
        pipelineApi.getStats(),
      ]);
      
      setStages(stagesRes.stages || []);
      // API returns deals_by_stage, not columns
      setKanbanData(kanbanRes?.deals_by_stage || kanbanRes?.columns || DEMO_KANBAN_DATA);
      setStats(statsRes || DEMO_PIPELINE_STATS);
    } catch (err) {
      console.error('Failed to load pipeline data:', err);
      setStages(DEMO_PIPELINE_STAGES);
      setKanbanData(DEMO_KANBAN_DATA);
      setStats(DEMO_PIPELINE_STATS);
      toast.error('Không thể tải dữ liệu pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Đã cập nhật dữ liệu');
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '0';
    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)} tỷ`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(0)}tr`;
    return num.toLocaleString('vi-VN');
  };

  // Handle drag end
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // No destination or same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const dealId = draggableId;
    const newStage = destination.droppableId;
    const oldStage = source.droppableId;
    
    // Find deal
    const deal = kanbanData[oldStage]?.deals?.find(d => d.id === dealId);
    if (!deal) return;

    // If moving to special stages, show confirmation
    if (['holding', 'booking', 'closed_won', 'closed_lost'].includes(newStage)) {
      setPendingStageChange({ deal, oldStage, newStage });
      setShowStageChangeModal(true);
      return;
    }

    // Direct stage change for other stages
    await performStageChange(dealId, oldStage, newStage);
  };

  // Perform actual stage change
  const performStageChange = async (dealId, oldStage, newStage, notes = null) => {
    // Optimistic update
    const updatedKanban = { ...kanbanData };
    const deal = updatedKanban[oldStage]?.deals?.find(d => d.id === dealId);
    
    if (deal) {
      // Remove from old stage
      updatedKanban[oldStage] = {
        ...updatedKanban[oldStage],
        deals: updatedKanban[oldStage].deals.filter(d => d.id !== dealId),
        count: (updatedKanban[oldStage].count || 0) - 1,
      };
      
      // Add to new stage
      updatedKanban[newStage] = {
        ...updatedKanban[newStage],
        deals: [...(updatedKanban[newStage]?.deals || []), { ...deal, stage: newStage }],
        count: (updatedKanban[newStage]?.count || 0) + 1,
      };
      
      setKanbanData(updatedKanban);
    }

    try {
      await pipelineApi.changeStage(dealId, newStage, notes);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Đã chuyển stage: {newStage}</span>
        </div>
      );
      // Refresh stats
      const statsRes = await pipelineApi.getStats();
      setStats(statsRes);
    } catch (err) {
      console.error('Stage change failed:', err);
      toast.error(err.message || 'Không thể chuyển stage');
      // Revert on error
      await loadData();
    }
  };

  // Confirm stage change (for special stages)
  const confirmStageChange = async () => {
    if (!pendingStageChange) return;
    
    const { deal, oldStage, newStage } = pendingStageChange;
    await performStageChange(deal.id, oldStage, newStage, stageChangeNotes);
    
    setShowStageChangeModal(false);
    setPendingStageChange(null);
    setStageChangeNotes('');
  };

  // Create new deal
  const handleCreateDeal = async () => {
    try {
      await pipelineApi.createDeal({
        lead_name: newDeal.lead_name,
        lead_phone: newDeal.lead_phone,
        lead_email: newDeal.lead_email,
        product_id: newDeal.product_id || null,
        value: newDeal.value ? parseFloat(newDeal.value) : null,
        notes: newDeal.notes,
      });
      
      toast.success('Đã tạo deal mới');
      setShowCreateModal(false);
      setNewDeal({ lead_name: '', lead_phone: '', lead_email: '', product_id: '', value: '', notes: '' });
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể tạo deal');
    }
  };

  // Filter deals by search
  const filterDeals = (deals) => {
    if (!search) return deals;
    const s = search.toLowerCase();
    return deals.filter(deal => 
      deal.lead_name?.toLowerCase().includes(s) ||
      deal.deal_code?.toLowerCase().includes(s) ||
      deal.product_name?.toLowerCase().includes(s)
    );
  };

  // Render deal card
  const renderDealCard = (deal, index) => (
    <Draggable key={deal.id} draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-2 ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
        >
          <Card 
            className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${
              STAGE_COLORS[deal.stage]?.split(' ')[2] || 'border-gray-300'
            }`}
            onClick={() => {
              setSelectedDeal(deal);
              setShowDealModal(true);
            }}
            data-testid={`deal-card-${deal.id}`}
          >
            <CardContent className="p-3">
              {/* Drag Handle */}
              <div 
                {...provided.dragHandleProps}
                className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" data-testid="deal-customer-name">
                    {deal.lead_name || 'Khách hàng mới'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{deal.deal_code || 'NEW'}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Product & Value */}
              <div className="mt-2 space-y-1">
                {deal.product_name && (
                  <div className="flex items-center text-xs text-gray-600">
                    <Building2 className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span className="truncate" data-testid="deal-product-name">{deal.product_name}</span>
                  </div>
                )}
                <div className="flex items-center text-xs font-medium text-gray-700">
                  <DollarSign className="h-3 w-3 mr-1.5 flex-shrink-0" />
                  <span data-testid="deal-value">{formatCurrency(deal.value)}</span>
                </div>
              </div>
              
              {/* Status Badge */}
              {deal.inventory_status && (
                <div className="mt-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-[10px] px-1.5 py-0 ${STAGE_COLORS[deal.inventory_status] || ''}`}
                    data-testid="deal-status-badge"
                  >
                    {deal.inventory_status_label || deal.inventory_status}
                  </Badge>
                </div>
              )}
              
              {/* Owner */}
              {deal.owner_name && (
                <div className="mt-2 flex items-center">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-1.5">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500 truncate">{deal.owner_name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="pipeline-kanban-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Sales Pipeline
          </h1>
          <p className="text-gray-500">9-stage sales pipeline với inventory sync</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm deal..."
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="deal-search-input"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            data-testid="refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowCreateModal(true)} data-testid="create-deal-btn">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Deal
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng deals</p>
                <p className="text-xl font-bold">{stats.total_deals || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng giá trị</p>
                <p className="text-xl font-bold">{formatCurrency(stats.total_value)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đang hold</p>
                <p className="text-xl font-bold">{stats.by_stage?.holding?.count || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đã chốt</p>
                <p className="text-xl font-bold">{stats.by_stage?.closed_won?.count || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => {
              // API returns stage.id, not stage.code
              const stageCode = stage.code || stage.id;
              const stageData = kanbanData[stageCode] || { deals: [], count: 0, total_value: 0 };
              // deals_by_stage returns arrays directly, not objects with deals property
              const dealsArray = Array.isArray(stageData) ? stageData : (stageData.deals || []);
              const filteredDeals = filterDeals(dealsArray);
              
              return (
                <div 
                  key={stageCode} 
                  className="w-72 flex-shrink-0"
                  data-testid={`stage-column-${stageCode}`}
                >
                  {/* Stage Header */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{STAGE_ICONS[stageCode] || '📋'}</span>
                        <Badge 
                          className={STAGE_COLORS[stageCode] || 'bg-gray-100'}
                          variant="secondary"
                        >
                          {stage.label || stage.name || stageCode}
                        </Badge>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {filteredDeals.length}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatCurrency(stageData.total_value || 0)}</span>
                    </div>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={stageCode}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[300px] rounded-lg p-2 transition-colors ${
                          snapshot.isDraggingOver 
                            ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
                            : 'bg-gray-50/50'
                        }`}
                      >
                        {filteredDeals.map((deal, index) => renderDealCard(deal, index))}
                        {provided.placeholder}
                        
                        {filteredDeals.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Kéo deal vào đây
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Deal Detail Modal */}
      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết Deal</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedDeal.lead_name || 'N/A'}</h3>
                  <p className="text-sm text-gray-500">{selectedDeal.deal_code}</p>
                </div>
                <Badge className={STAGE_COLORS[selectedDeal.stage]}>
                  {STAGE_ICONS[selectedDeal.stage]} {selectedDeal.stage}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Sản phẩm</p>
                  <p className="font-medium flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedDeal.product_name || 'Chưa chọn'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giá trị</p>
                  <p className="font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(selectedDeal.value)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái hàng</p>
                  <Badge variant="outline" className={STAGE_COLORS[selectedDeal.inventory_status]}>
                    {selectedDeal.inventory_status || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người phụ trách</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedDeal.owner_name || 'Chưa giao'}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Liên hệ</p>
                <div className="space-y-2">
                  {selectedDeal.lead_phone && (
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedDeal.lead_phone}
                    </Button>
                  )}
                  {selectedDeal.lead_email && (
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedDeal.lead_email}
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Hành động nhanh</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      setPendingStageChange({ 
                        deal: selectedDeal, 
                        oldStage: selectedDeal.stage, 
                        newStage: 'holding' 
                      });
                      setShowDealModal(false);
                      setShowStageChangeModal(true);
                    }}
                    disabled={selectedDeal.stage === 'holding' || selectedDeal.stage === 'closed_won'}
                    data-testid="quick-hold-btn"
                  >
                    <Hand className="h-4 w-4 mr-2 text-amber-600" />
                    Giữ hàng
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      setPendingStageChange({ 
                        deal: selectedDeal, 
                        oldStage: selectedDeal.stage, 
                        newStage: 'booking' 
                      });
                      setShowDealModal(false);
                      setShowStageChangeModal(true);
                    }}
                    disabled={selectedDeal.stage === 'booking' || selectedDeal.stage === 'closed_won'}
                    data-testid="quick-booking-btn"
                  >
                    <CalendarCheck className="h-4 w-4 mr-2 text-orange-600" />
                    Đặt cọc
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDealModal(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Change Confirmation Modal */}
      <Dialog open={showStageChangeModal} onOpenChange={setShowStageChangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Xác nhận chuyển stage
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ đồng bộ trạng thái inventory
            </DialogDescription>
          </DialogHeader>
          {pendingStageChange && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Chuyển deal <strong>{pendingStageChange.deal.lead_name || pendingStageChange.deal.deal_code}</strong>
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={STAGE_COLORS[pendingStageChange.oldStage]}>
                    {STAGE_ICONS[pendingStageChange.oldStage]} {pendingStageChange.oldStage}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <Badge className={STAGE_COLORS[pendingStageChange.newStage]}>
                    {STAGE_ICONS[pendingStageChange.newStage]} {pendingStageChange.newStage}
                  </Badge>
                </div>
              </div>
              
              {['holding', 'booking', 'closed_won'].includes(pendingStageChange.newStage) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                  <p className="font-medium text-amber-800 mb-1">Lưu ý:</p>
                  {pendingStageChange.newStage === 'holding' && (
                    <p className="text-amber-700">Sản phẩm sẽ được đặt HOLD (giữ hàng 24h)</p>
                  )}
                  {pendingStageChange.newStage === 'booking' && (
                    <p className="text-amber-700">Sản phẩm sẽ chuyển sang trạng thái BOOKING</p>
                  )}
                  {pendingStageChange.newStage === 'closed_won' && (
                    <p className="text-amber-700">Sản phẩm sẽ được đánh dấu ĐÃ BÁN</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Ghi chú (không bắt buộc)</label>
                <Textarea
                  placeholder="Nhập ghi chú..."
                  value={stageChangeNotes}
                  onChange={(e) => setStageChangeNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowStageChangeModal(false);
                setPendingStageChange(null);
                setStageChangeNotes('');
              }}
            >
              Hủy
            </Button>
            <Button onClick={confirmStageChange} data-testid="confirm-stage-change-btn">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Deal Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Deal Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên khách hàng *</label>
              <Input
                placeholder="Nhập tên..."
                value={newDeal.lead_name}
                onChange={(e) => setNewDeal({ ...newDeal, lead_name: e.target.value })}
                data-testid="new-deal-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input
                  placeholder="0xxx..."
                  value={newDeal.lead_phone}
                  onChange={(e) => setNewDeal({ ...newDeal, lead_phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  placeholder="email@..."
                  value={newDeal.lead_email}
                  onChange={(e) => setNewDeal({ ...newDeal, lead_email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Giá trị deal (VND)</label>
              <Input
                type="number"
                placeholder="1000000000"
                value={newDeal.value}
                onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ghi chú</label>
              <Textarea
                placeholder="Ghi chú..."
                value={newDeal.notes}
                onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
            <Button 
              onClick={handleCreateDeal}
              disabled={!newDeal.lead_name}
              data-testid="submit-new-deal-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
