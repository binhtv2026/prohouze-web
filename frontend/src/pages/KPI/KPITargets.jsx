/**
 * KPI Targets Management Page
 * Prompt 12/20 - KPI & Performance Engine
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, Plus, Edit, Trash2, Calendar, Users,
  Building, User, Search, Filter, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { kpiApi } from '@/api/kpiApi';
import { toast } from 'sonner';

const DEMO_KPI_DEFINITIONS = [
  { code: 'revenue', name: 'Doanh số' },
  { code: 'booking', name: 'Booking' },
  { code: 'conversion', name: 'Tỷ lệ chuyển đổi' },
];

const DEMO_KPI_TARGETS = [
  { id: 'target-1', kpi_name: 'Doanh số', scope_type: 'team', scope_label: 'Team Rivera', period_label: 'Tháng 3/2026', minimum_threshold: 3000000000, target_value: 5000000000, stretch_target: 6500000000, team_name: 'Team Rivera' },
  { id: 'target-2', kpi_name: 'Booking', scope_type: 'individual', scope_label: 'Nguyễn Minh Anh', period_label: 'Tháng 3/2026', minimum_threshold: 3, target_value: 5, stretch_target: 7, user_name: 'Nguyễn Minh Anh' },
];

// Scope icons
const SCOPE_ICONS = {
  company: Building,
  branch: Building,
  team: Users,
  individual: User,
};

// Format currency
const formatCurrency = (value) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} tr`;
  return value.toLocaleString();
};

// Target Card Component
const TargetCard = ({ target, onEdit, onDelete }) => {
  const ScopeIcon = SCOPE_ICONS[target.scope_type] || Target;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <ScopeIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{target.kpi_name}</p>
              <p className="text-xs text-slate-500">{target.scope_label}</p>
            </div>
          </div>
          <Badge variant="outline">{target.period_label}</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">Tối thiểu</p>
            <p className="font-semibold text-slate-700">{formatCurrency(target.minimum_threshold)}</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Mục tiêu</p>
            <p className="font-bold text-blue-700">{formatCurrency(target.target_value)}</p>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-600">Stretch</p>
            <p className="font-semibold text-emerald-700">{formatCurrency(target.stretch_target)}</p>
          </div>
        </div>
        
        {target.user_name && (
          <p className="text-sm text-slate-600">
            <User className="w-3 h-3 inline mr-1" />
            {target.user_name}
          </p>
        )}
        {target.team_name && (
          <p className="text-sm text-slate-600">
            <Users className="w-3 h-3 inline mr-1" />
            {target.team_name}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Create Target Dialog
const CreateTargetDialog = ({ open, onOpenChange, definitions, onCreated }) => {
  const [formData, setFormData] = useState({
    kpi_code: '',
    scope_type: 'individual',
    period_type: 'monthly',
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    target_value: '',
    stretch_target: '',
    minimum_threshold: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await kpiApi.createTarget({
        ...formData,
        target_value: parseFloat(formData.target_value),
        stretch_target: formData.stretch_target ? parseFloat(formData.stretch_target) : null,
        minimum_threshold: formData.minimum_threshold ? parseFloat(formData.minimum_threshold) : null,
      });
      toast.success('Tạo mục tiêu thành công');
      onCreated();
      onOpenChange(false);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo mục tiêu KPI</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Chỉ số KPI</Label>
            <Select 
              value={formData.kpi_code} 
              onValueChange={(v) => setFormData({...formData, kpi_code: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn KPI" />
              </SelectTrigger>
              <SelectContent>
                {definitions.map((def) => (
                  <SelectItem key={def.code} value={def.code}>
                    {def.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phạm vi</Label>
              <Select 
                value={formData.scope_type} 
                onValueChange={(v) => setFormData({...formData, scope_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Công ty</SelectItem>
                  <SelectItem value="branch">Chi nhánh</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="individual">Cá nhân</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Kỳ</Label>
              <Select 
                value={formData.period_type} 
                onValueChange={(v) => setFormData({...formData, period_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Tháng</SelectItem>
                  <SelectItem value="quarterly">Quý</SelectItem>
                  <SelectItem value="yearly">Năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Năm</Label>
              <Input 
                type="number" 
                value={formData.period_year}
                onChange={(e) => setFormData({...formData, period_year: parseInt(e.target.value)})}
              />
            </div>
            
            {formData.period_type === 'monthly' && (
              <div>
                <Label>Tháng</Label>
                <Select 
                  value={String(formData.period_month)} 
                  onValueChange={(v) => setFormData({...formData, period_month: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                      <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div>
            <Label>Mục tiêu (Target)</Label>
            <Input 
              type="number" 
              value={formData.target_value}
              onChange={(e) => setFormData({...formData, target_value: e.target.value})}
              placeholder="Nhập giá trị mục tiêu"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ngưỡng tối thiểu</Label>
              <Input 
                type="number" 
                value={formData.minimum_threshold}
                onChange={(e) => setFormData({...formData, minimum_threshold: e.target.value})}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Stretch Target</Label>
              <Input 
                type="number" 
                value={formData.stretch_target}
                onChange={(e) => setFormData({...formData, stretch_target: e.target.value})}
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Đang tạo...' : 'Tạo mục tiêu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Targets Page
const KPITargets = () => {
  const [targets, setTargets] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    period_type: 'monthly',
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [targetsData, defsData] = await Promise.all([
        kpiApi.getTargets(filters),
        kpiApi.getDefinitions(),
      ]);
      setTargets(Array.isArray(targetsData) && targetsData.length > 0 ? targetsData : DEMO_KPI_TARGETS);
      setDefinitions(Array.isArray(defsData) && defsData.length > 0 ? defsData : DEMO_KPI_DEFINITIONS);
    } catch (err) {
      setTargets(DEMO_KPI_TARGETS);
      setDefinitions(DEMO_KPI_DEFINITIONS);
      toast.error('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-6 space-y-6" data-testid="kpi-targets">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-blue-600" />
            Mục tiêu KPI
          </h1>
          <p className="text-slate-500">Thiết lập và quản lý mục tiêu</p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo mục tiêu
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Lọc:</span>
            </div>
            
            <Select 
              value={filters.period_type} 
              onValueChange={(v) => setFilters({...filters, period_type: v})}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Tháng</SelectItem>
                <SelectItem value="quarterly">Quý</SelectItem>
                <SelectItem value="yearly">Năm</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={String(filters.period_year)} 
              onValueChange={(v) => setFilters({...filters, period_year: parseInt(v)})}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {filters.period_type === 'monthly' && (
              <Select 
                value={String(filters.period_month)} 
                onValueChange={(v) => setFilters({...filters, period_month: parseInt(v)})}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                    <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Targets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : targets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có mục tiêu nào được thiết lập</p>
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Tạo mục tiêu đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {targets.map((target) => (
            <TargetCard 
              key={target.id} 
              target={target}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateTargetDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        definitions={definitions}
        onCreated={loadData}
      />
    </div>
  );
};

export default KPITargets;
