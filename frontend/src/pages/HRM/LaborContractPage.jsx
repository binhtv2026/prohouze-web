import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  FileText,
  Users,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Pen,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_CONTRACTS = [
  {
    id: 'labor-001',
    contract_number: 'HDLD-2026-001',
    employee_name: 'Nguyen Minh Anh',
    contract_type: 'fixed_term',
    status: 'active',
    base_salary: 18000000,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    position_name: 'Chuyen vien kinh doanh',
    org_unit_name: 'Phong Kinh doanh 1'
  },
  {
    id: 'labor-002',
    contract_number: 'HDLD-2026-014',
    employee_name: 'Tran Thi Thu Ha',
    contract_type: 'probation',
    status: 'pending_sign',
    base_salary: 12000000,
    start_date: '2026-03-20',
    end_date: '2026-05-19',
    position_name: 'Chuyen vien Marketing',
    org_unit_name: 'Phong Marketing'
  }
];

const DEMO_TEMPLATES = {
  probation: { name: 'Hop dong thu viec 2 thang' },
  fixed_term: { name: 'Hop dong lao dong co thoi han 12 thang' },
  indefinite: { name: 'Hop dong lao dong khong thoi han' }
};

const DEMO_EMPLOYEES = [
  { id: 'emp-001', full_name: 'Nguyen Minh Anh' },
  { id: 'emp-002', full_name: 'Tran Thi Thu Ha' },
  { id: 'emp-003', full_name: 'Le Hoang Nam' }
];

const DEMO_POSITIONS = [
  { id: 'pos-001', name: 'Chuyen vien kinh doanh' },
  { id: 'pos-002', name: 'Chuyen vien Marketing' },
  { id: 'pos-003', name: 'Ke toan tong hop' }
];

const DEMO_ORG_UNITS = [
  { id: 'org-001', name: 'Phong Kinh doanh 1' },
  { id: 'org-002', name: 'Phong Marketing' },
  { id: 'org-003', name: 'Phong Tai chinh' }
];

const contractTypeLabels = {
  probation: { label: 'Thử việc', color: 'bg-amber-100 text-amber-700' },
  fixed_term: { label: 'Có thời hạn', color: 'bg-blue-100 text-blue-700' },
  indefinite: { label: 'Không thời hạn', color: 'bg-green-100 text-green-700' },
  seasonal: { label: 'Mùa vụ', color: 'bg-purple-100 text-purple-700' },
  part_time: { label: 'Bán thời gian', color: 'bg-slate-100 text-slate-700' },
};

const statusLabels = {
  draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
  pending_sign: { label: 'Chờ ký', color: 'bg-amber-100 text-amber-700' },
  active: { label: 'Hiệu lực', color: 'bg-green-100 text-green-700' },
  expired: { label: 'Hết hạn', color: 'bg-red-100 text-red-700' },
  terminated: { label: 'Chấm dứt', color: 'bg-slate-100 text-slate-700' },
};

export default function LaborContractPage() {
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState({});
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [filters, setFilters] = useState({
    contract_type: 'all',
    status: 'all',
    search: '',
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    contract_type: 'probation',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    position_id: '',
    org_unit_id: '',
    salary_type: 'gross',
    base_salary: '',
    allowances: {
      lunch: 730000,
      phone: 0,
      transport: 0,
    },
    working_hours_per_week: 48,
    working_days_per_week: 6,
    probation_salary_percent: 85,
    notice_period_days: 30,
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hrm-advanced/contracts');
      setContracts(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_CONTRACTS);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts(DEMO_CONTRACTS);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get('/hrm-advanced/contract-templates');
      setTemplates(res.data && typeof res.data === 'object' ? res.data : DEMO_TEMPLATES);
    } catch (error) {
      console.error('Error:', error);
      setTemplates(DEMO_TEMPLATES);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setEmployees(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_EMPLOYEES);
    } catch (error) {
      console.error('Error:', error);
      setEmployees(DEMO_EMPLOYEES);
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await api.get('/hrm/positions');
      setPositions(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_POSITIONS);
    } catch (error) {
      console.error('Error:', error);
      setPositions(DEMO_POSITIONS);
    }
  }, []);

  const fetchOrgUnits = useCallback(async () => {
    try {
      const res = await api.get('/hrm/org-units');
      setOrgUnits(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_ORG_UNITS);
    } catch (error) {
      console.error('Error:', error);
      setOrgUnits(DEMO_ORG_UNITS);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchTemplates();
    fetchEmployees();
    fetchPositions();
    fetchOrgUnits();
  }, [fetchContracts, fetchTemplates, fetchEmployees, fetchPositions, fetchOrgUnits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        base_salary: parseFloat(formData.base_salary),
        end_date: formData.end_date || null,
      };

      await api.post('/hrm-advanced/contracts', payload);
      toast.success('Đã tạo hợp đồng lao động');
      setShowDialog(false);
      fetchContracts();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể tạo hợp đồng');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      contract_type: 'probation',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      position_id: '',
      org_unit_id: '',
      salary_type: 'gross',
      base_salary: '',
      allowances: {
        lunch: 730000,
        phone: 0,
        transport: 0,
      },
      working_hours_per_week: 48,
      working_days_per_week: 6,
      probation_salary_percent: 85,
      notice_period_days: 30,
    });
  };

  const handleSignContract = async (contractId, signerType) => {
    try {
      await api.post(`/hrm-advanced/contracts/${contractId}/sign?signer_type=${signerType}`);
      toast.success(`Đã ký hợp đồng (${signerType === 'employer' ? 'Công ty' : 'Nhân viên'})`);
      fetchContracts();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể ký hợp đồng');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (filters.contract_type !== 'all' && c.contract_type !== filters.contract_type) return false;
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!c.employee_name?.toLowerCase().includes(search) && !c.contract_number?.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [contracts, filters]);

  // Stats
  const totalActive = contracts.filter((c) => c.status === 'active').length;
  const totalPending = contracts.filter((c) => c.status === 'draft' || c.status === 'pending_sign').length;
  const totalExpiring = contracts.filter((c) => {
    if (!c.end_date) return false;
    const endDate = new Date(c.end_date);
    const now = new Date();
    const diff = (endDate - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  }).length;

  return (
    <div className="space-y-6" data-testid="labor-contract-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hợp đồng Lao động</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý hợp đồng theo Bộ luật Lao động 2019</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-contract-btn">
              <Plus className="h-4 w-4 mr-2" />
              Tạo hợp đồng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Tạo Hợp đồng Lao động
              </DialogTitle>
              <DialogDescription>
                Hợp đồng tuân thủ Điều 20-27 Bộ luật Lao động 2019
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee & Contract Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nhân viên *</Label>
                  <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Loại hợp đồng *</Label>
                  <Select value={formData.contract_type} onValueChange={(v) => setFormData({ ...formData, contract_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contractTypeLabels).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Position & Org Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vị trí công việc *</Label>
                  <Select value={formData.position_id} onValueChange={(v) => setFormData({ ...formData, position_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phòng ban *</Label>
                  <Select value={formData.org_unit_id} onValueChange={(v) => setFormData({ ...formData, org_unit_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày bắt đầu *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Ngày kết thúc {formData.contract_type !== 'indefinite' ? '*' : '(Để trống nếu không xác định)'}</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required={formData.contract_type !== 'indefinite'}
                  />
                </div>
              </div>

              {/* Salary */}
              <div className="p-4 rounded-lg bg-slate-50 space-y-4">
                <h4 className="font-medium text-slate-900">Lương & Phụ cấp</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Loại lương</Label>
                    <Select value={formData.salary_type} onValueChange={(v) => setFormData({ ...formData, salary_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gross">Gross</SelectItem>
                        <SelectItem value="net">Net</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Lương cơ bản (VNĐ/tháng) *</Label>
                    <Input
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                      placeholder="15,000,000"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Phụ cấp ăn trưa</Label>
                    <Input
                      type="number"
                      value={formData.allowances.lunch}
                      onChange={(e) => setFormData({ ...formData, allowances: { ...formData.allowances, lunch: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <Label>Phụ cấp điện thoại</Label>
                    <Input
                      type="number"
                      value={formData.allowances.phone}
                      onChange={(e) => setFormData({ ...formData, allowances: { ...formData.allowances, phone: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <Label>Phụ cấp xăng xe</Label>
                    <Input
                      type="number"
                      value={formData.allowances.transport}
                      onChange={(e) => setFormData({ ...formData, allowances: { ...formData.allowances, transport: Number(e.target.value) } })}
                    />
                  </div>
                </div>
              </div>

              {/* Probation Info */}
              {formData.contract_type === 'probation' && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                  <h4 className="font-medium text-amber-800">Thông tin Thử việc (Điều 24-27 BLLĐ)</h4>
                  <div>
                    <Label>Tỷ lệ lương thử việc (Tối thiểu 85%)</Label>
                    <Input
                      type="number"
                      min="85"
                      max="100"
                      value={formData.probation_salary_percent}
                      onChange={(e) => setFormData({ ...formData, probation_salary_percent: Number(e.target.value) })}
                    />
                  </div>
                  <p className="text-xs text-amber-600">
                    Thời gian thử việc tối đa: 60 ngày (nhân viên), 180 ngày (giám đốc)
                  </p>
                </div>
              )}

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số giờ làm việc/tuần (Tối đa 48h)</Label>
                  <Input
                    type="number"
                    max="48"
                    value={formData.working_hours_per_week}
                    onChange={(e) => setFormData({ ...formData, working_hours_per_week: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Số ngày làm việc/tuần</Label>
                  <Input
                    type="number"
                    max="6"
                    value={formData.working_days_per_week}
                    onChange={(e) => setFormData({ ...formData, working_days_per_week: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Notice Period */}
              <div>
                <Label>Thời hạn báo trước (ngày)</Label>
                <Input
                  type="number"
                  value={formData.notice_period_days}
                  onChange={(e) => setFormData({ ...formData, notice_period_days: Number(e.target.value) })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Theo Điều 35: HĐ không xác định thời hạn cần báo trước 45 ngày
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">Tạo hợp đồng</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Tổng hợp đồng</p>
                <p className="text-2xl font-bold text-blue-700">{contracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Đang hiệu lực</p>
                <p className="text-2xl font-bold text-green-700">{totalActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Chờ ký</p>
                <p className="text-2xl font-bold text-amber-700">{totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Sắp hết hạn</p>
                <p className="text-2xl font-bold text-red-700">{totalExpiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Tên nhân viên, mã HĐ..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div className="w-40">
              <Label className="mb-2 block">Loại HĐ</Label>
              <Select value={filters.contract_type} onValueChange={(v) => setFilters({ ...filters, contract_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(contractTypeLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label className="mb-2 block">Trạng thái</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(statusLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Hợp đồng</CardTitle>
          <CardDescription>Quản lý hợp đồng lao động của nhân viên</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có hợp đồng nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract) => {
                const typeInfo = contractTypeLabels[contract.contract_type] || contractTypeLabels.fixed_term;
                const statusInfo = statusLabels[contract.status] || statusLabels.draft;

                return (
                  <div
                    key={contract.id}
                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900">{contract.contract_number}</p>
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{contract.employee_name}</p>
                          <p className="text-sm text-slate-500">{contract.position_title} - {contract.org_unit_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(contract.net_salary)}</p>
                        <p className="text-xs text-slate-500">Thực nhận/tháng</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-slate-500">Lương Gross</p>
                        <p className="font-medium">{formatCurrency(contract.total_salary)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">BHXH + BHYT + BHTN</p>
                        <p className="font-medium text-red-600">
                          -{formatCurrency(contract.social_insurance + contract.health_insurance + contract.unemployment_insurance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Thuế TNCN</p>
                        <p className="font-medium text-red-600">-{formatCurrency(contract.personal_income_tax)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Thời hạn HĐ</p>
                        <p className="font-medium">
                          {contract.start_date} → {contract.end_date || 'Không xác định'}
                        </p>
                      </div>
                    </div>

                    {/* Sign Status */}
                    {contract.status === 'draft' && (
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${contract.signed_by_employer ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <span className="text-sm">Công ty</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${contract.signed_by_employee ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <span className="text-sm">Nhân viên</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!contract.signed_by_employer && user?.role && ['bod', 'admin', 'hr'].includes(user.role) && (
                            <Button size="sm" variant="outline" onClick={() => handleSignContract(contract.id, 'employer')}>
                              <Pen className="h-4 w-4 mr-1" />
                              Công ty ký
                            </Button>
                          )}
                          {!contract.signed_by_employee && contract.employee_id === user?.id && (
                            <Button size="sm" onClick={() => handleSignContract(contract.id, 'employee')}>
                              <Pen className="h-4 w-4 mr-1" />
                              Nhân viên ký
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Templates Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Mẫu Hợp đồng theo BLLĐ 2019
          </CardTitle>
          <CardDescription>Các loại hợp đồng lao động theo quy định pháp luật</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(templates).map(([key, template]) => (
              <div key={key} className="p-4 rounded-lg border bg-gradient-to-br from-slate-50 to-white">
                <h4 className="font-medium text-slate-900 mb-2">{template.name}</h4>
                {template.duration_months && (
                  <p className="text-sm text-slate-600 mb-2">
                    Thời hạn tối đa: {template.duration_months} tháng
                  </p>
                )}
                {template.salary_percent && (
                  <p className="text-sm text-slate-600 mb-2">
                    Lương tối thiểu: {template.salary_percent}% lương chính thức
                  </p>
                )}
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Điều khoản bắt buộc:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {template.required_clauses?.slice(0, 4).map((clause, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {clause}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
