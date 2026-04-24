import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { leadsAPI, usersAPI, aiAPI, activitiesAPI } from '@/lib/api';
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
  Brain,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
// Dynamic Data - Prompt 3/20
import { useMasterData } from '@/hooks/useDynamicData';
import { DynamicSelect, DynamicFilterSelect, StatusBadge, SourceBadge } from '@/components/forms/DynamicSelect';
// AI Insight - Prompt 18/20 PHASE 3
import { AILeadInsightPanel } from '@/components/ai';

const DEMO_LEADS = [
  { id: 'lead-page-1', full_name: 'Nguyễn Thành Long', phone: '0901234567', phone_masked: '0901***567', email: 'long@example.com', source: 'facebook', status: 'hot', project_interest: 'Rivera', budget_min: 2800000000, budget_max: 3500000000, notes: 'Muốn mua căn góc', score: 86, score_grade: 'A' },
  { id: 'lead-page-2', full_name: 'Phạm Hương Giang', phone: '0912345678', phone_masked: '0912***678', email: 'giang@example.com', source: 'zalo', status: 'warm', project_interest: 'Sunrise', budget_min: 2200000000, budget_max: 2900000000, notes: 'Quan tâm tiến độ thanh toán', score: 72, score_grade: 'B' },
  { id: 'lead-page-3', full_name: 'Lê Hoàng Việt', phone: '0987654321', phone_masked: '0987***321', email: 'viet@example.com', source: 'website', status: 'new', project_interest: 'Skyline', budget_min: 1800000000, budget_max: 2300000000, notes: 'Để lại thông tin trên form', score: 58, score_grade: 'C' },
];

const DEMO_SALES_USERS = [
  { id: 'sales-user-1', full_name: 'Nguyễn Minh Anh' },
  { id: 'sales-user-2', full_name: 'Trần Quốc Huy' },
];

export default function LeadsPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // table or kanban
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [scoreResult, setScoreResult] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    search: '',
  });
  const [newLead, setNewLead] = useState({
    full_name: '',
    phone: '',
    email: '',
    source: 'website',
    project_interest: '',
    budget_min: '',
    budget_max: '',
    notes: '',
  });
  
  // Use Dynamic Master Data instead of hardcoded arrays (Prompt 3/20)
  const { items: leadStatuses, getLabel: getStatusLabel, getColor: getStatusColor } = useMasterData('lead_statuses');
  const { items: leadSources, getLabel: getSourceLabel } = useMasterData('lead_sources');

  const loadLeads = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      if (filters.search) params.search = filters.search;
      
      const response = await leadsAPI.getAll(params);
      const payload = Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_LEADS;
      setLeads(payload.filter((lead) => {
        const matchesStatus = !filters.status || lead.status === filters.status;
        const matchesSource = !filters.source || lead.source === filters.source;
        const q = filters.search?.toLowerCase?.() || '';
        const matchesSearch = !q || lead.full_name?.toLowerCase().includes(q) || lead.phone?.includes(q) || lead.project_interest?.toLowerCase().includes(q);
        return matchesStatus && matchesSource && matchesSearch;
      }));
    } catch (error) {
      setLeads(DEMO_LEADS.filter((lead) => {
        const matchesStatus = !filters.status || lead.status === filters.status;
        const matchesSource = !filters.source || lead.source === filters.source;
        const q = filters.search?.toLowerCase?.() || '';
        const matchesSearch = !q || lead.full_name?.toLowerCase().includes(q) || lead.phone?.includes(q) || lead.project_interest?.toLowerCase().includes(q);
        return matchesStatus && matchesSource && matchesSearch;
      }));
      toast.error('Không thể tải danh sách lead');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await usersAPI.getAll({ role: 'sales' });
      setUsers(Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_SALES_USERS);
    } catch (e) {
      console.log('No access to users');
      setUsers(DEMO_SALES_USERS);
    }
  }, []);

  useEffect(() => {
    loadLeads();
    loadUsers();
  }, [loadLeads, loadUsers]);

  const handleAddLead = async () => {
    try {
      await leadsAPI.create({
        ...newLead,
        budget_min: newLead.budget_min ? parseFloat(newLead.budget_min) : null,
        budget_max: newLead.budget_max ? parseFloat(newLead.budget_max) : null,
      });
      toast.success('Thêm lead thành công!');
      setShowAddModal(false);
      setNewLead({
        full_name: '',
        phone: '',
        email: '',
        source: 'other',
        project_interest: '',
        budget_min: '',
        budget_max: '',
        notes: '',
      });
      loadLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể thêm lead');
    }
  };

  const handleUpdateLead = async () => {
    try {
      await leadsAPI.update(selectedLead.id, selectedLead);
      toast.success('Cập nhật lead thành công!');
      setShowEditModal(false);
      loadLeads();
    } catch (error) {
      toast.error('Không thể cập nhật lead');
    }
  };

  const handleAssignLead = async (userId) => {
    try {
      await leadsAPI.assign(selectedLead.id, userId);
      toast.success('Phân công lead thành công!');
      setShowAssignModal(false);
      loadLeads();
    } catch (error) {
      toast.error('Không thể phân công lead');
    }
  };

  const handleLeadScoring = async (lead) => {
    setSelectedLead(lead);
    setShowScoreModal(true);
    setScoreResult(null);
    try {
      const response = await aiAPI.analyzeLead(lead.id);
      setScoreResult(response.data);
      // Refresh leads to get updated score
      loadLeads();
    } catch (error) {
      toast.error('Không thể phân tích lead');
    }
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  // Kanban columns - use dynamic data (Prompt 3/20)
  // Take first 8 statuses (exclude closed states for kanban)
  const kanbanColumns = leadStatuses.filter(s => s.group !== 'closed').slice(0, 8);

  const getLeadsByStatus = (status) => {
    return leads.filter((lead) => lead.status === status);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="leads-page">
      <PageHeader
        title="Quản lý Lead"
        subtitle="Danh sách lead và quản lý phễu bán hàng"
        breadcrumbs={[
          { label: 'CRM', path: '/crm/leads' },
          { label: 'Leads', path: '/crm/leads' },
        ]}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm lead..."
        onAddNew={() => setShowAddModal(true)}
        addNewLabel="Thêm Lead"
        showNotifications={true}
        showAIButton={true}
      />

      <div className="p-6">
        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Dynamic Filter Select for Status - Prompt 3/20 */}
            <DynamicFilterSelect
              source="lead_statuses"
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              placeholder="Trạng thái"
              allLabel="Tất cả"
              className="w-40"
              testId="filter-status"
            />

            {/* Dynamic Filter Select for Source - Prompt 3/20 */}
            <DynamicFilterSelect
              source="lead_sources"
              value={filters.source}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value }))}
              placeholder="Nguồn"
              allLabel="Tất cả nguồn"
              className="w-40"
              testId="filter-source"
            />

            <Badge variant="outline" className="text-slate-600">
              {leads.length} leads
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
              data-testid="view-table-btn"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('kanban')}
              data-testid="view-kanban-btn"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold text-slate-700">Họ tên</TableHead>
                    <TableHead className="font-bold text-slate-700">SĐT</TableHead>
                    <TableHead className="font-bold text-slate-700">Nguồn</TableHead>
                    <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="font-bold text-slate-700">Điểm AI</TableHead>
                    <TableHead className="font-bold text-slate-700">Phụ trách</TableHead>
                    <TableHead className="font-bold text-slate-700">Ngày tạo</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <React.Fragment key={lead.id}>
                      <TableRow 
                        className={`table-row-hover cursor-pointer ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}`} 
                        data-testid={`lead-row-${lead.id}`}
                        onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                      >
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            {selectedLead?.id === lead.id ? (
                              <ChevronUp className="w-4 h-4 text-[#316585]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <p>{lead.full_name}</p>
                              {lead.email && <p className="text-xs text-slate-500">{lead.email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{lead.phone_masked}</TableCell>
                        <TableCell>
                          {/* Dynamic Source Badge - Prompt 3/20 */}
                          <SourceBadge code={lead.source} />
                        </TableCell>
                        <TableCell>
                          {/* Dynamic Status Badge - Prompt 3/20 */}
                          <StatusBadge source="lead_statuses" code={lead.status} />
                        </TableCell>
                        <TableCell>
                          {lead.score > 0 ? (
                            <Badge className={getScoreColor(lead.score)}>
                              {lead.score}
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleLeadScoring(lead); }}
                              className="text-xs text-[#316585] hover:text-[#264f68]"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Đánh giá
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {lead.assigned_to_name || '-'}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(lead.created_at)}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`lead-actions-${lead.id}`}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedLead(lead); setShowEditModal(true); }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleLeadScoring(lead)}>
                                <Brain className="w-4 h-4 mr-2" />
                                AI Scoring
                              </DropdownMenuItem>
                              {hasRole(['bod', 'admin', 'manager', 'marketing']) && (
                                <DropdownMenuItem onClick={() => { setSelectedLead(lead); setShowAssignModal(true); }}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Phân công
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {/* AI Insight Panel - Phase 3 */}
                      {selectedLead?.id === lead.id && (
                        <TableRow>
                          <TableCell colSpan={8} className="p-0 border-0">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-slate-50 border-t border-b border-blue-100">
                              <AILeadInsightPanel 
                                leadId={lead.id}
                                onActionComplete={() => loadLeads()}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Kanban View - Using Dynamic Data (Prompt 3/20) */}
        {viewMode === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanColumns.map((column) => (
              <div key={column.code} className="w-80 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={column.color || 'bg-slate-100 text-slate-700'}>{column.label}</Badge>
                    <span className="text-sm text-slate-500">
                      {getLeadsByStatus(column.code).length}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 bg-slate-100/50 rounded-lg p-3 min-h-[400px]">
                  {getLeadsByStatus(column.code).map((lead) => (
                    <Card
                      key={lead.id}
                      className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => { setSelectedLead(lead); setShowEditModal(true); }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{lead.full_name}</h4>
                          {lead.score > 0 && (
                            <Badge className={`${getScoreColor(lead.score)} text-xs`}>
                              {lead.score}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{lead.phone_masked}</p>
                        <div className="flex items-center justify-between">
                          <SourceBadge code={lead.source} className="text-xs" />
                          <span className="text-xs text-slate-400">
                            {formatDate(lead.created_at)}
                          </span>
                        </div>
                        {lead.assigned_to_name && (
                          <p className="text-xs text-slate-500 mt-2">
                            👤 {lead.assigned_to_name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm Lead Mới</DialogTitle>
            <DialogDescription>Nhập thông tin khách hàng tiềm năng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Họ tên *</Label>
                <Input
                  value={newLead.full_name}
                  onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  data-testid="add-lead-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại *</Label>
                <Input
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="0901234567"
                  data-testid="add-lead-phone"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="add-lead-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Nguồn</Label>
                {/* Dynamic Select for Source - Prompt 3/20 */}
                <DynamicSelect
                  source="lead_sources"
                  value={newLead.source}
                  onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                  placeholder="Chọn nguồn"
                  testId="add-lead-source"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dự án quan tâm</Label>
              <Input
                value={newLead.project_interest}
                onChange={(e) => setNewLead({ ...newLead, project_interest: e.target.value })}
                placeholder="Sky Garden, The Sun..."
                data-testid="add-lead-project"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngân sách từ (VND)</Label>
                <Input
                  type="number"
                  value={newLead.budget_min}
                  onChange={(e) => setNewLead({ ...newLead, budget_min: e.target.value })}
                  placeholder="1000000000"
                  data-testid="add-lead-budget-min"
                />
              </div>
              <div className="space-y-2">
                <Label>Ngân sách đến (VND)</Label>
                <Input
                  type="number"
                  value={newLead.budget_max}
                  onChange={(e) => setNewLead({ ...newLead, budget_max: e.target.value })}
                  placeholder="3000000000"
                  data-testid="add-lead-budget-max"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Thông tin thêm về khách hàng..."
                data-testid="add-lead-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddLead} className="bg-[#316585] hover:bg-[#264f68]" data-testid="add-lead-submit">
              Thêm Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Họ tên</Label>
                  <Input
                    value={selectedLead.full_name}
                    onChange={(e) => setSelectedLead({ ...selectedLead, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  {/* Dynamic Select for Status - Prompt 3/20 */}
                  <DynamicSelect
                    source="lead_statuses"
                    value={selectedLead.status}
                    onValueChange={(value) => setSelectedLead({ ...selectedLead, status: value })}
                    showColor={true}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea
                  value={selectedLead.notes || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateLead} className="bg-[#316585] hover:bg-[#264f68]">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Lead Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân công Lead</DialogTitle>
            <DialogDescription>
              Chọn nhân viên sales để phụ trách lead này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleAssignLead(u.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] font-medium">
                  {u.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{u.full_name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Score Modal */}
      <Dialog open={showScoreModal} onOpenChange={setShowScoreModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#316585]" />
              AI Lead Scoring
            </DialogTitle>
          </DialogHeader>
          {scoreResult ? (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold ${getScoreColor(scoreResult.score)}`}>
                  {scoreResult.score}
                </div>
                <p className="mt-3 text-slate-600">{scoreResult.recommendation}</p>
              </div>
              <div className="space-y-2 bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900">Các yếu tố đánh giá:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-slate-600">Nguồn:</p>
                  <p className="text-slate-900">{getSourceLabel(scoreResult.factors?.source)}</p>
                  <p className="text-slate-600">Ngân sách:</p>
                  <p className="text-slate-900">{scoreResult.factors?.budget}</p>
                  <p className="text-slate-600">Tương tác:</p>
                  <p className="text-slate-900">{scoreResult.factors?.engagement} lần</p>
                  <p className="text-slate-600">Trạng thái:</p>
                  <p className="text-slate-900">{getStatusLabel(scoreResult.factors?.status)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
