import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Target,
  DollarSign,
  TrendingUp,
  User,
  Building2,
  ChevronRight,
  ArrowRight,
  X,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { AIDealInsightPanel } from '@/components/ai';

const stageColors = {
  lead: 'bg-slate-100 border-slate-300',
  contacted: 'bg-blue-50 border-blue-300',
  viewing: 'bg-amber-50 border-amber-300',
  negotiation: 'bg-purple-50 border-purple-300',
  proposal: 'bg-indigo-50 border-indigo-300',
  won: 'bg-green-50 border-green-300',
  lost: 'bg-red-50 border-red-300',
};

const stages = [
  { id: 'lead', label: 'Lead mới', color: 'slate' },
  { id: 'contacted', label: 'Đã liên hệ', color: 'blue' },
  { id: 'viewing', label: 'Xem nhà', color: 'amber' },
  { id: 'negotiation', label: 'Đàm phán', color: 'purple' },
  { id: 'proposal', label: 'Báo giá', color: 'indigo' },
  { id: 'won', label: 'Thành công', color: 'green' },
];

export default function DealsPage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const [dealsRes, pipelineRes] = await Promise.allSettled([
        api.get('/sales/deals'),
        api.get('/sales/deals/pipeline'),
      ]);

      setDeals(dealsRes.status === 'fulfilled' ? dealsRes.value?.data || [] : []);
      setPipeline(pipelineRes.status === 'fulfilled' ? pipelineRes.value?.data || [] : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.stage === newStage) {
      setDraggedDeal(null);
      return;
    }

    try {
      await api.put(`/sales/deals/${draggedDeal.id}`, { stage: newStage });
      setDeals(deals.map(d => 
        d.id === draggedDeal.id ? { ...d, stage: newStage } : d
      ));
      toast.success('Cập nhật giai đoạn thành công!');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
    setDraggedDeal(null);
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const getDealsByStage = (stage) => deals.filter(d => d.stage === stage);
  const getTotalValue = (stage) => getDealsByStage(stage).reduce((acc, d) => acc + (d.value || 0), 0);

  return (
    <div className="space-y-6" data-testid="deals-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý deals theo giai đoạn</p>
        </div>
        <Button data-testid="add-deal-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo Deal
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Tổng deals</p>
                <p className="text-2xl font-bold text-blue-700">{deals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Pipeline Value</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((acc, d) => acc + (d.value || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Thành công</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + (d.value || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Pipeline */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-xl border-2 ${stageColors[stage.id]} p-3 min-h-[500px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              data-testid={`pipeline-stage-${stage.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{stage.label}</h3>
                  <p className="text-xs text-slate-500">{formatCurrency(getTotalValue(stage.id))}</p>
                </div>
                <Badge variant="secondary">{getDealsByStage(stage.id).length}</Badge>
              </div>

              <div className="space-y-2">
                {getDealsByStage(stage.id).map((deal) => (
                  <React.Fragment key={deal.id}>
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onClick={() => setSelectedDeal(selectedDeal?.id === deal.id ? null : deal)}
                      className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                        draggedDeal?.id === deal.id ? 'opacity-50' : ''
                      } ${selectedDeal?.id === deal.id ? 'ring-2 ring-blue-500' : ''}`}
                      data-testid={`deal-${deal.id}`}
                    >
                      <p className="font-medium text-sm">{deal.title || deal.customer_name}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{deal.product_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(deal.value || 0)}
                        </span>
                        {deal.assignee_name && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <User className="h-3 w-3" />
                            {deal.assignee_name.split(' ').pop()}
                          </span>
                        )}
                      </div>
                      {selectedDeal?.id === deal.id && (
                        <div className="mt-2 pt-2 border-t text-xs text-blue-500 flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          AI Analysis đang hiển thị bên dưới
                        </div>
                      )}
                    </div>
                    {/* AI Deal Insight Panel - Phase 3 */}
                    {selectedDeal?.id === deal.id && (
                      <div className="mt-2 p-0">
                        <AIDealInsightPanel 
                          dealId={deal.id}
                          onActionComplete={fetchDeals}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {getDealsByStage(stage.id).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Kéo deal vào đây
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
