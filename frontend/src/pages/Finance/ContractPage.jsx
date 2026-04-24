import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  FileSignature,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Eye,
  Pen,
} from 'lucide-react';
import { toast } from 'sonner';

const contractTypeLabels = {
  property_sale: 'HĐ mua bán BĐS',
  brokerage: 'HĐ môi giới',
  deposit: 'HĐ đặt cọc',
  rental: 'HĐ thuê',
  collaborator: 'HĐ CTV',
  employment: 'HĐ lao động',
  service: 'HĐ dịch vụ',
  partnership: 'HĐ hợp tác',
};

const statusLabels = {
  draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
  pending_review: { label: 'Chờ xem xét', color: 'bg-yellow-100 text-yellow-700' },
  pending_signature: { label: 'Chờ ký', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Đang hiệu lực', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Đã hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
  expired: { label: 'Hết hạn', color: 'bg-orange-100 text-orange-700' },
  terminated: { label: 'Đã chấm dứt', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Đã huỷ', color: 'bg-gray-100 text-gray-700' },
};

const DEMO_CONTRACTS = [
  {
    id: 'fc-001',
    title: 'Hợp đồng môi giới khách VIP',
    contract_type: 'brokerage',
    property_address: 'The Horizon City - Block A1 - Căn 1208',
    party_b: { name: 'Pham Gia Bao' },
    contract_value: 4250000000,
    deposit_amount: 200000000,
    status: 'pending_signature',
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc-002',
    title: 'Hợp đồng đặt cọc dự án mở bán',
    contract_type: 'deposit',
    property_address: 'The Horizon City - Block B2 - Căn 0915',
    party_b: { name: 'Tran Thu Ha' },
    contract_value: 3150000000,
    deposit_amount: 100000000,
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

export default function ContractPage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [filters, setFilters] = useState({
    contract_type: 'all',
    status: 'all',
  });

  const [formData, setFormData] = useState({
    contract_type: 'brokerage',
    title: '',
    party_a: {
      party_type: 'company',
      name: 'Công ty Cổ phần ProHouze',
      representative: '',
      position: 'Giám đốc',
      address: '',
      phone: '',
      tax_code: '',
    },
    party_b: {
      party_type: 'individual',
      name: '',
      address: '',
      phone: '',
      id_number: '',
    },
    property_address: '',
    contract_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    deposit_amount: 0,
    terms_and_conditions: '',
    notes: '',
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.contract_type && filters.contract_type !== 'all') params.append('contract_type', filters.contract_type);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const res = await api.get(`/finance/contracts?${params.toString()}`);
      const contractItems = Array.isArray(res.data) ? res.data : [];
      setContracts(contractItems.length > 0 ? contractItems : DEMO_CONTRACTS);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts(DEMO_CONTRACTS);
      toast.error('Không thể tải danh sách hợp đồng, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/contracts', formData);
      toast.success('Đã tạo hợp đồng');
      setShowDialog(false);
      resetForm();
      fetchContracts();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Không thể tạo hợp đồng');
    }
  };

  const resetForm = () => {
    setFormData({
      contract_type: 'brokerage',
      title: '',
      party_a: {
        party_type: 'company',
        name: 'Công ty Cổ phần ProHouze',
        representative: '',
        position: 'Giám đốc',
        address: '',
        phone: '',
        tax_code: '',
      },
      party_b: {
        party_type: 'individual',
        name: '',
        address: '',
        phone: '',
        id_number: '',
      },
      property_address: '',
      contract_value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      deposit_amount: 0,
      terms_and_conditions: '',
      notes: '',
    });
  };

  const handleSign = async (contractId, party) => {
    try {
      await api.put(`/finance/contracts/${contractId}/sign?party=${party}`);
      toast.success(`Đã ký hợp đồng (Bên ${party.toUpperCase()})`);
      fetchContracts();
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error('Không thể ký hợp đồng');
    }
  };

  const handleViewDetail = async (contractId) => {
    try {
      const res = await api.get(`/finance/contracts/${contractId}`);
      setSelectedContract(res.data);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error fetching contract:', error);
      const fallbackContract = DEMO_CONTRACTS.find((item) => item.id === contractId) || DEMO_CONTRACTS[0];
      setSelectedContract(fallbackContract);
      setShowDetailDialog(true);
      toast.error('Không thể tải chi tiết hợp đồng, đang hiển thị dữ liệu mẫu');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  return (
    <div className="space-y-6" data-testid="contract-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Hợp đồng</h1>
          <p className="text-slate-500 text-sm mt-1">Tạo và quản lý các loại hợp đồng kinh doanh</p>
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
              <DialogTitle>Tạo Hợp đồng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại hợp đồng</Label>
                  <Select value={formData.contract_type} onValueChange={(v) => setFormData({ ...formData, contract_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contractTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tiêu đề hợp đồng</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Tên/Tiêu đề hợp đồng"
                    required
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bên A (Công ty)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tên công ty</Label>
                    <Input
                      value={formData.party_a.name}
                      onChange={(e) => setFormData({ ...formData, party_a: { ...formData.party_a, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Người đại diện</Label>
                    <Input
                      value={formData.party_a.representative}
                      onChange={(e) => setFormData({ ...formData, party_a: { ...formData.party_a, representative: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Chức vụ</Label>
                    <Input
                      value={formData.party_a.position}
                      onChange={(e) => setFormData({ ...formData, party_a: { ...formData.party_a, position: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Mã số thuế</Label>
                    <Input
                      value={formData.party_a.tax_code}
                      onChange={(e) => setFormData({ ...formData, party_a: { ...formData.party_a, tax_code: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Bên B (Khách hàng)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Họ tên</Label>
                    <Input
                      value={formData.party_b.name}
                      onChange={(e) => setFormData({ ...formData, party_b: { ...formData.party_b, name: e.target.value } })}
                      required
                    />
                  </div>
                  <div>
                    <Label>CCCD/CMND</Label>
                    <Input
                      value={formData.party_b.id_number}
                      onChange={(e) => setFormData({ ...formData, party_b: { ...formData.party_b, id_number: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Điện thoại</Label>
                    <Input
                      value={formData.party_b.phone}
                      onChange={(e) => setFormData({ ...formData, party_b: { ...formData.party_b, phone: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Địa chỉ</Label>
                    <Input
                      value={formData.party_b.address}
                      onChange={(e) => setFormData({ ...formData, party_b: { ...formData.party_b, address: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Giá trị hợp đồng (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Tiền đặt cọc (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ngày bắt đầu</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Ngày kết thúc</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Địa chỉ BĐS (nếu có)</Label>
                <Input
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                  placeholder="Địa chỉ bất động sản liên quan"
                />
              </div>

              <div>
                <Label>Điều khoản</Label>
                <Textarea
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  placeholder="Các điều khoản hợp đồng"
                  rows={4}
                />
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileSignature className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tổng hợp đồng</p>
                <p className="text-2xl font-bold text-slate-800">{contracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đang hiệu lực</p>
                <p className="text-2xl font-bold text-slate-800">{contracts.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Chờ ký</p>
                <p className="text-2xl font-bold text-slate-800">{contracts.filter(c => c.status === 'pending_signature').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <FileSignature className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Nháp</p>
                <p className="text-2xl font-bold text-slate-800">{contracts.filter(c => c.status === 'draft').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Label className="mb-2 block">Loại hợp đồng</Label>
              <Select value={filters.contract_type} onValueChange={(v) => setFilters({ ...filters, contract_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(contractTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label className="mb-2 block">Trạng thái</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(statusLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setFilters({ contract_type: 'all', status: 'all' })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contract List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileSignature className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có hợp đồng nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
                      <FileSignature className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{contract.contract_no}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusLabels[contract.status]?.color || 'bg-slate-100'}`}>
                          {statusLabels[contract.status]?.label || contract.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{contract.title}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Badge variant="outline">{contractTypeLabels[contract.contract_type] || contract.contract_type}</Badge>
                        <span>•</span>
                        <span>{contract.party_b?.name}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-800">{formatCurrency(contract.contract_value)}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {contract.signed_by_a && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        <span>Bên A: {contract.signed_by_a ? 'Đã ký' : 'Chưa ký'}</span>
                        <span>|</span>
                        {contract.signed_by_b && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        <span>Bên B: {contract.signed_by_b ? 'Đã ký' : 'Chưa ký'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetail(contract.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!contract.signed_by_a && (
                        <Button size="sm" variant="outline" onClick={() => handleSign(contract.id, 'a')}>
                          <Pen className="h-4 w-4 mr-1" />
                          Ký A
                        </Button>
                      )}
                      {!contract.signed_by_b && (
                        <Button size="sm" onClick={() => handleSign(contract.id, 'b')}>
                          <Pen className="h-4 w-4 mr-1" />
                          Ký B
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Hợp đồng {selectedContract?.contract_no}</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{selectedContract.title}</h3>
                  <p className="text-sm text-slate-500">{contractTypeLabels[selectedContract.contract_type]}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusLabels[selectedContract.status]?.color}`}>
                  {statusLabels[selectedContract.status]?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-700 mb-2">Bên A</h4>
                  <p className="font-medium">{selectedContract.party_a?.name}</p>
                  <p className="text-sm text-slate-500">Đại diện: {selectedContract.party_a?.representative}</p>
                  <p className="text-sm text-slate-500">Chức vụ: {selectedContract.party_a?.position}</p>
                  {selectedContract.signed_by_a ? (
                    <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Đã ký ngày {selectedContract.signed_at_a ? new Date(selectedContract.signed_at_a).toLocaleDateString('vi-VN') : ''}
                    </div>
                  ) : (
                    <div className="mt-2 text-yellow-600 text-sm">Chưa ký</div>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-700 mb-2">Bên B</h4>
                  <p className="font-medium">{selectedContract.party_b?.name}</p>
                  <p className="text-sm text-slate-500">CCCD: {selectedContract.party_b?.id_number}</p>
                  <p className="text-sm text-slate-500">ĐT: {selectedContract.party_b?.phone}</p>
                  {selectedContract.signed_by_b ? (
                    <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Đã ký ngày {selectedContract.signed_at_b ? new Date(selectedContract.signed_at_b).toLocaleDateString('vi-VN') : ''}
                    </div>
                  ) : (
                    <div className="mt-2 text-yellow-600 text-sm">Chưa ký</div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Giá trị hợp đồng:</span>
                  <span className="font-semibold">{formatCurrency(selectedContract.contract_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bằng chữ:</span>
                  <span className="italic text-sm">{selectedContract.contract_value_words}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tiền đặt cọc:</span>
                  <span>{formatCurrency(selectedContract.deposit_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Đã thanh toán:</span>
                  <span>{formatCurrency(selectedContract.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Còn lại:</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(selectedContract.remaining_amount)}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm text-slate-500">
                <span>Ngày bắt đầu: {new Date(selectedContract.start_date).toLocaleDateString('vi-VN')}</span>
                {selectedContract.end_date && (
                  <span>Ngày kết thúc: {new Date(selectedContract.end_date).toLocaleDateString('vi-VN')}</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
