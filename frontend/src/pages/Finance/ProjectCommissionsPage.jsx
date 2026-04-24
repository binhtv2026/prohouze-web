/**
 * Project Commission Config Page
 * Cấu hình % Hoa hồng theo Dự án
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  Building, Percent, Plus, Search, Calendar, Check
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getProjectCommissions,
  createProjectCommission,
} from '../../api/financeApi';

const DEMO_PROJECTS = [
  { id: 'project-1', name: 'The Privé Residence', code: 'PRIVE' },
  { id: 'project-2', name: 'Glory Heights', code: 'GLORY' },
  { id: 'project-3', name: 'Masteri Lumière', code: 'LUMIERE' },
];

const DEMO_PROJECT_COMMISSIONS = [
  { id: 'pc-1', project_name: 'The Privé Residence', project_code: 'PRIVE', developer_name: 'The Privé Development', commission_rate: 2.0, effective_from: '2026-03-01', effective_to: null, is_active: true, notes: 'Áp dụng chiến dịch mở bán tháng 3' },
  { id: 'pc-2', project_name: 'Glory Heights', project_code: 'GLORY', developer_name: 'Glory Land', commission_rate: 1.8, effective_from: '2026-02-15', effective_to: '2026-04-30', is_active: true, notes: 'Ưu tiên team sale khu Đông' },
];

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Project Commission Card
function ProjectCommissionCard({ config }) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${!config.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-sm">{config.project_name || config.project_code}</p>
            <p className="text-xs text-gray-500">{config.project_code}</p>
          </div>
          {config.is_active ? (
            <Badge className="bg-green-100 text-green-700">Đang áp dụng</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-700">Ngừng</Badge>
          )}
        </div>

        {/* Developer */}
        {config.developer_name && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            <span>CĐT: {config.developer_name}</span>
          </div>
        )}

        {/* Commission Rate */}
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg mb-3">
          <Percent className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-2xl font-bold text-blue-600">{config.commission_rate}%</span>
        </div>

        {/* Effective period */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Từ: {formatDate(config.effective_from)}</span>
          </div>
          {config.effective_to && (
            <div className="flex items-center gap-1">
              <span className="ml-4">Đến: {formatDate(config.effective_to)}</span>
            </div>
          )}
          {!config.effective_to && (
            <div className="flex items-center gap-1 text-green-600">
              <Check className="w-3 h-3" />
              <span>Không thời hạn</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {config.notes && (
          <p className="text-xs text-gray-500 mt-2 italic">{config.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Create Config Dialog
function CreateConfigDialog({ open, onClose, projects, onSubmit }) {
  const [projectId, setProjectId] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveTo, setEffectiveTo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!projectId) {
      toast.error('Vui lòng chọn dự án');
      return;
    }
    if (!commissionRate || parseFloat(commissionRate) <= 0) {
      toast.error('Vui lòng nhập % hoa hồng hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        project_id: projectId,
        commission_rate: parseFloat(commissionRate),
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        notes,
      });
      // Reset form
      setProjectId('');
      setCommissionRate('');
      setEffectiveFrom(new Date().toISOString().split('T')[0]);
      setEffectiveTo('');
      setNotes('');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cấu hình % Hoa hồng dự án</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Dự án *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn dự án" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>% Hoa hồng *</Label>
            <Input
              type="number"
              step="0.1"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="VD: 2.0"
            />
            <p className="text-xs text-gray-500">Tỉ lệ % trên giá trị hợp đồng</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày bắt đầu *</Label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
              <p className="text-xs text-gray-500">Bỏ trống = vô thời hạn</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Page
export default function ProjectCommissionsPage() {
  const [configs, setConfigs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configsData, projectsData] = await Promise.all([
        getProjectCommissions(),
        fetchProjects(),
      ]);
      setConfigs(configsData?.length > 0 ? configsData : DEMO_PROJECT_COMMISSIONS);
      setProjects(projectsData?.length > 0 ? projectsData : DEMO_PROJECTS);
    } catch (error) {
      toast.warning('Đang hiển thị dữ liệu mẫu cho hoa hồng dự án');
      setConfigs(DEMO_PROJECT_COMMISSIONS);
      setProjects(DEMO_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function fetchProjects() {
    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/products/projects?limit=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) return DEMO_PROJECTS;
    const data = await response.json();
    return data.items || data || DEMO_PROJECTS;
  }

  async function handleCreateConfig(data) {
    await createProjectCommission(data);
    toast.success('Đã tạo cấu hình hoa hồng');
    loadData();
  }

  // Filter
  const filteredConfigs = configs.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.project_name?.toLowerCase().includes(q) ||
      c.project_code?.toLowerCase().includes(q) ||
      c.developer_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 p-4" data-testid="project-commissions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cấu hình hoa hồng dự án</h1>
          <p className="text-sm text-gray-500">Thiết lập % hoa hồng cho từng dự án</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Thêm cấu hình
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Mỗi dự án phải có cấu hình % hoa hồng trước khi tính hoa hồng cho các hợp đồng. 
          Công thức: <strong>Hoa hồng = Giá trị HĐ × % Hoa hồng dự án</strong>
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Tìm theo tên dự án, mã, CĐT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Percent className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chưa có cấu hình nào</p>
          <Button variant="link" onClick={() => setCreateDialogOpen(true)}>
            Thêm cấu hình đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConfigs.map((config) => (
            <ProjectCommissionCard key={config.id} config={config} />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateConfigDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        projects={projects}
        onSubmit={handleCreateConfig}
      />
    </div>
  );
}
