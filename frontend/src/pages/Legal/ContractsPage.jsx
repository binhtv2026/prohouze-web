import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Scale,
  FileText,
  Calendar,
  User,
  Eye,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const contractTypes = [
  { value: 'sale', label: 'Hợp đồng mua bán' },
  { value: 'lease', label: 'Hợp đồng thuê' },
  { value: 'service', label: 'Hợp đồng dịch vụ' },
  { value: 'labor', label: 'Hợp đồng lao động' },
  { value: 'agency', label: 'Hợp đồng môi giới' },
  { value: 'cooperation', label: 'Hợp đồng hợp tác' },
];

const statusColors = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  terminated: 'bg-amber-100 text-amber-700',
};

export default function LegalContractsPage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: '',
    contract_type: 'sale',
    party_a: '',
    party_b: '',
    start_date: '',
    end_date: '',
    value: 0,
    description: '',
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(false);
    // Mock data
    setContracts([
      { id: '1', title: 'HĐ Thuê văn phòng Quận 1', contract_type: 'lease', party_a: 'ProHouze', party_b: 'ABC Corp', start_date: '2025-01-01', end_date: '2026-12-31', value: 500000000, status: 'active' },
      { id: '2', title: 'HĐ Mua bán căn hộ A1.05', contract_type: 'sale', party_a: 'Nguyễn Văn A', party_b: 'ProHouze', start_date: '2025-06-15', end_date: '2025-12-15', value: 3500000000, status: 'active' },
      { id: '3', title: 'HĐ Dịch vụ Marketing', contract_type: 'service', party_a: 'ProHouze', party_b: 'Digital Agency', start_date: '2025-01-01', end_date: '2025-12-31', value: 200000000, status: 'active' },
      { id: '4', title: 'HĐ Hợp tác phân phối', contract_type: 'cooperation', party_a: 'ProHouze', party_b: 'Sunshine Group', start_date: '2024-06-01', end_date: '2025-06-01', value: 0, status: 'expired' },
    ]);
  };

  const handleCreate = async () => {
    toast.success('Tạo hợp đồng thành công!');
    setShowDialog(false);
    setForm({ title: '', contract_type: 'sale', party_a: '', party_b: '', start_date: '', end_date: '', value: 0, description: '' });
    fetchContracts();
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const filteredContracts = contracts.filter(c => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.contract_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6" data-testid="legal-contracts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hợp đồng Pháp lý</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các hợp đồng pháp lý của doanh nghiệp</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="add-contract-btn">
          <Plus className="h-4 w-4 mr-2" />
          Thêm hợp đồng
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm hợp đồng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Loại hợp đồng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {contractTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contracts List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Scale className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Chưa có hợp đồng nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredContracts.map((contract) => (
                <div key={contract.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`contract-${contract.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{contract.title}</p>
                        <Badge className={statusColors[contract.status]}>
                          {contract.status === 'active' ? 'Hiệu lực' :
                           contract.status === 'expired' ? 'Hết hạn' :
                           contract.status === 'terminated' ? 'Chấm dứt' : 'Nháp'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span>{contract.party_a} ↔ {contract.party_b}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(contract.value)}</p>
                      <p className="text-xs text-slate-400">
                        {contractTypes.find(t => t.value === contract.contract_type)?.label}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm hợp đồng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên hợp đồng *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: HĐ Thuê văn phòng Q1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Loại hợp đồng</label>
              <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Bên A</label>
                <Input
                  value={form.party_a}
                  onChange={(e) => setForm({ ...form, party_a: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bên B</label>
                <Input
                  value={form.party_b}
                  onChange={(e) => setForm({ ...form, party_b: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ngày bắt đầu</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ngày kết thúc</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Giá trị hợp đồng (VND)</label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.title}>Tạo hợp đồng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
