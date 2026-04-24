/**
 * Leads Pipeline Page - Kanban View
 * Prompt 6/20 - CRM Unified Profile Standardization
 * UPDATED: Using Dynamic Form Renderer (Prompt 3/20 Phase 4)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { crmLeadsAPI, contactsAPI, crmConfigAPI } from '@/lib/crmApi';
import { formatDate, getScoreColor, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Edit,
  Trash2,
  UserPlus,
  Target,
  Filter,
  LayoutGrid,
  List,
  ArrowRight,
  ChevronRight,
  DollarSign,
  Building2,
  Clock,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  Brain,
} from 'lucide-react';
import { AILeadInsightPanel } from '@/components/ai';
import { LeadFormModal } from '@/components/forms/LeadFormModal';

const DEFAULT_LEAD_STAGES = [
  { code: 'new', label: 'Lead mới', color: 'bg-blue-100 text-blue-700' },
  { code: 'contacted', label: 'Đã liên hệ', color: 'bg-sky-100 text-sky-700' },
  { code: 'qualified', label: 'Tiềm năng', color: 'bg-amber-100 text-amber-700' },
  { code: 'proposal', label: 'Đã tư vấn', color: 'bg-purple-100 text-purple-700' },
  { code: 'converted', label: 'Đang chốt', color: 'bg-emerald-100 text-emerald-700' },
];

const buildDemoLeads = ({ stage = '', source = '', status = '', search = '' } = {}) => {
  const demoLeads = [
    {
      id: 'demo-lead-1',
      stage: 'new',
      status: 'hot',
      contact_name: 'Nguyễn Thành Nam',
      contact_phone: '0903 111 222',
      contact_phone_masked: '0903 *** 222',
      project_interest: 'The Privé Quận 2',
      budget_display: '8,5 tỷ',
      source: 'facebook',
      assigned_to_name: 'Lê Minh Quân',
      score: 92,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-lead-2',
      stage: 'contacted',
      status: 'warm',
      contact_name: 'Trần Mỹ Linh',
      contact_phone: '0912 555 666',
      contact_phone_masked: '0912 *** 666',
      project_interest: 'Gladia by the Waters',
      budget_display: '6,2 tỷ',
      source: 'zalo',
      assigned_to_name: 'Lê Minh Quân',
      score: 76,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'demo-lead-3',
      stage: 'qualified',
      status: 'hot',
      contact_name: 'Phạm Khánh Vy',
      contact_phone: '0988 777 888',
      contact_phone_masked: '0988 *** 888',
      project_interest: 'Masteri Grand View',
      budget_display: '11 tỷ',
      source: 'referral',
      assigned_to_name: 'Nguyễn Phương Anh',
      score: 88,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'demo-lead-4',
      stage: 'proposal',
      status: 'warm',
      contact_name: 'Đỗ Hoàng Minh',
      contact_phone: '0936 999 000',
      contact_phone_masked: '0936 *** 000',
      project_interest: 'Eaton Park',
      budget_display: '12,8 tỷ',
      source: 'website',
      assigned_to_name: 'Nguyễn Phương Anh',
      score: 81,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'demo-lead-5',
      stage: 'converted',
      status: 'hot',
      contact_name: 'Lưu Gia Hân',
      contact_phone: '0977 123 456',
      contact_phone_masked: '0977 *** 456',
      project_interest: 'The Global City',
      budget_display: '15,4 tỷ',
      source: 'facebook',
      assigned_to_name: 'Trần Quang Huy',
      score: 95,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ];

  return demoLeads.filter((lead) => {
    const matchesStage = !stage || lead.stage === stage;
    const matchesSource = !source || lead.source === source;
    const matchesStatus = !status || lead.status === status;
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      [lead.contact_name, lead.project_interest, lead.contact_phone].some((value) =>
        String(value || '').toLowerCase().includes(normalizedSearch)
      );
    return matchesStage && matchesSource && matchesStatus && matchesSearch;
  });
};

export default function LeadsPipelinePage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadStages, setLeadStages] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  // View mode
  const [viewMode, setViewMode] = useState('kanban');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    stage: searchParams.get('stage') || '',
    status: searchParams.get('status') || '',
    source: searchParams.get('source') || '',
    search: searchParams.get('search') || '',
  });

  const loadData = useCallback(async () => {
    try {
      const [stagesRes, contactsRes] = await Promise.all([
        crmConfigAPI.getLeadStages(),
        contactsAPI.getAll({ limit: 100 }),
      ]);
      setLeadStages(stagesRes.data?.stages?.length ? stagesRes.data.stages : DEFAULT_LEAD_STAGES);
      setContacts(contactsRes.data || []);
    } catch (error) {
      console.error('Failed to load config:', error);
      setLeadStages(DEFAULT_LEAD_STAGES);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.stage) params.stage = filters.stage;
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      if (filters.search) params.search = filters.search;
      
      const response = await crmLeadsAPI.getAll(params);
      const nextLeads = Array.isArray(response.data) ? response.data : [];
      setLeads(nextLeads.length ? nextLeads : buildDemoLeads(filters));
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads(buildDemoLeads(filters));
      toast.warning('Đang hiển thị dữ liệu mẫu vì chưa tải được lead thật');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleChangeStage = async (newStage, reason = '') => {
    try {
      await crmLeadsAPI.changeStage(selectedLead.id, {
        new_stage: newStage,
        reason: reason,
        create_deal: newStage === 'converted',
      });
      toast.success('Chuyển giai đoạn thành công!');
      setShowStageModal(false);
      loadLeads();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) 
        ? detail.map(e => e.msg || e).join(', ')
        : (typeof detail === 'string' ? detail : 'Không thể chuyển giai đoạn');
      toast.error(errorMsg);
    }
  };

  // Handle Edit Lead
  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const getLeadsByStage = (stageCode) => {
    return leads.filter(lead => lead.stage === stageCode);
  };

  const getStageInfo = (stageCode) => {
    return leadStages.find(s => s.code === stageCode) || {};
  };

  // Kanban columns - exclude terminal stages from main view
  const kanbanColumns = leadStages.filter(s => 
    !['disqualified', 'lost', 'recycled'].includes(s.code)
  );

  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6" data-testid="leads-pipeline-loading">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="flex gap-4 overflow-x-auto">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-72 shrink-0">
                <Skeleton className="h-8 w-full mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="leads-pipeline-page">
      <PageHeader
        title="Lead Pipeline"
        subtitle="Quản lý và theo dõi leads theo giai đoạn"
        breadcrumbs={[
          { label: 'CRM', path: '/crm' },
          { label: 'Leads', path: '/crm/leads' },
        ]}
        onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
        searchPlaceholder="Tìm kiếm lead..."
        onAddNew={() => setShowAddModal(true)}
        addNewLabel="Thêm Lead"
      />

      <div className="p-6">
        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Giai đoạn</Label>
              <select
                value={filters.stage || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value === 'all' ? '' : e.target.value }))}
                className="h-10 w-40 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-[#316585] focus:outline-none"
                data-testid="filter-stage"
              >
                <option value="all">Tất cả</option>
                {leadStages.map((stage) => (
                  <option key={stage.code} value={stage.code}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Nguồn</Label>
              <select
                value={filters.source || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value === 'all' ? '' : e.target.value }))}
                className="h-10 w-40 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-[#316585] focus:outline-none"
                data-testid="filter-source"
              >
                <option value="all">Tất cả nguồn</option>
                <option value="website">Website</option>
                <option value="facebook">Facebook</option>
                <option value="zalo">Zalo</option>
                <option value="referral">Referral</option>
                <option value="event">Event</option>
              </select>
            </div>

            <Badge variant="outline" className="text-slate-600">
              {leads.length} leads
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('kanban')}
              data-testid="view-kanban-btn"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              data-testid="view-list-btn"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadLeads}
              data-testid="refresh-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="w-full overflow-x-auto">
            <div className="flex gap-4 pb-4">
              {kanbanColumns.map((stage) => {
                const stageLeads = getLeadsByStage(stage.code);
                return (
                  <div key={stage.code} className="w-72 shrink-0" data-testid={`kanban-column-${stage.code}`}>
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <Badge className={stage.color || 'bg-slate-100 text-slate-700'}>
                          {stage.label}
                        </Badge>
                        <span className="text-sm text-slate-500 font-medium">
                          {stageLeads.length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Column Content */}
                    <div className="space-y-3 bg-slate-100/70 rounded-xl p-3 min-h-[500px]">
                      {stageLeads.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Không có lead</p>
                        </div>
                      ) : (
                        stageLeads.map((lead) => (
                          <Card
                            key={lead.id}
                            className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer border-0"
                            onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                            data-testid={`lead-card-${lead.id}`}
                          >
                            <CardContent className="p-4">
                              {/* Lead Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] text-sm font-medium">
                                    {lead.contact_name?.charAt(0) || 'L'}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-slate-900 text-sm line-clamp-1">
                                      {lead.contact_name || 'Unknown'}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                      {lead.contact_phone_masked || lead.contact_phone}
                                    </p>
                                  </div>
                                </div>
                                {lead.score > 0 && (
                                  <Badge className={`${getScoreColor(lead.score)} text-xs`}>
                                    {lead.score}
                                  </Badge>
                                )}
                              </div>

                              {/* Lead Info */}
                              {lead.project_interest && (
                                <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-600">
                                  <Building2 className="w-3.5 h-3.5" />
                                  <span className="line-clamp-1">{lead.project_interest}</span>
                                </div>
                              )}

                              {lead.budget_display && (
                                <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-600">
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>{lead.budget_display}</span>
                                </div>
                              )}

                              {/* Lead Footer */}
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                <Badge variant="outline" className="text-xs">
                                  {lead.source}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {formatDate(lead.created_at)}
                                </span>
                              </div>

                              {/* Assigned User */}
                              {lead.assigned_to_name && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                                  <User className="w-3 h-3" />
                                  <span>{lead.assigned_to_name}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card className="bg-white">
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="p-12 text-center">
                  <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Chưa có lead nào</h3>
                  <p className="text-slate-500 mb-4">Bắt đầu bằng cách thêm lead đầu tiên</p>
                  <Button onClick={() => setShowAddModal(true)} className="bg-[#316585] hover:bg-[#264f68]">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Lead
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {leads.map((lead) => {
                    const stageInfo = getStageInfo(lead.stage);
                    return (
                      <div 
                        key={lead.id}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4"
                        onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                        data-testid={`lead-row-${lead.id}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] font-medium shrink-0">
                          {lead.contact_name?.charAt(0) || 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-900">{lead.contact_name || 'Unknown'}</h4>
                            <Badge className={stageInfo.color || 'bg-slate-100 text-slate-700'}>
                              {stageInfo.label || lead.stage}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 truncate">
                            {lead.project_interest || lead.source || 'No info'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-slate-900">{lead.budget_display || '-'}</p>
                          <p className="text-xs text-slate-500">{formatDate(lead.created_at)}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Lead Modal - Using Dynamic Form */}
      <LeadFormModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        lead={null}
        onSuccess={loadLeads}
      />
      
      <LeadFormModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) setEditingLead(null);
        }}
        lead={editingLead}
        onSuccess={loadLeads}
      />

      {/* Lead Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#316585]" />
              Chi tiết Lead
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6 py-4">
              {/* AI Insight Panel - Phase 3 */}
              <AILeadInsightPanel 
                leadId={selectedLead.id}
                onActionComplete={loadLeads}
              />
              
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] text-2xl font-medium">
                  {selectedLead.contact_name?.charAt(0) || 'L'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">{selectedLead.contact_name || 'Unknown'}</h3>
                  <p className="text-slate-500">{selectedLead.contact_phone_masked || selectedLead.contact_phone}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStageInfo(selectedLead.stage).color || 'bg-slate-100 text-slate-700'}>
                      {getStageInfo(selectedLead.stage).label || selectedLead.stage}
                    </Badge>
                    <Badge variant="outline">{selectedLead.source}</Badge>
                    {selectedLead.score > 0 && (
                      <Badge className={getScoreColor(selectedLead.score)}>
                        Score: {selectedLead.score}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Dự án quan tâm</p>
                  <p className="font-medium">{selectedLead.project_interest || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Ngân sách</p>
                  <p className="font-medium">{selectedLead.budget_display || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Phụ trách</p>
                  <p className="font-medium">{selectedLead.assigned_to_name || 'Chưa phân công'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Ngày tạo</p>
                  <p className="font-medium">{formatDate(selectedLead.created_at)}</p>
                </div>
              </div>

              {/* Stage Transition */}
              <div className="pt-4 border-t">
                <Label className="mb-3 block">Chuyển giai đoạn</Label>
                <div className="flex flex-wrap gap-2">
                  {leadStages
                    .filter(s => {
                      const currentStage = leadStages.find(st => st.code === selectedLead.stage);
                      return currentStage?.allowed_next?.includes(s.code);
                    })
                    .map(stage => (
                      <Button
                        key={stage.code}
                        variant="outline"
                        size="sm"
                        className={`${stage.color?.replace('bg-', 'border-').replace('text-', 'text-')}`}
                        onClick={() => handleChangeStage(stage.code)}
                      >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        {stage.label}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Đóng
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleEditLead(selectedLead)}
              data-testid="edit-lead-btn"
            >
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button 
              className="bg-[#316585] hover:bg-[#264f68]"
              onClick={() => {
                setShowDetailModal(false);
                navigate(`/crm/contacts?id=${selectedLead?.contact_id}`);
              }}
            >
              Xem Profile đầy đủ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
