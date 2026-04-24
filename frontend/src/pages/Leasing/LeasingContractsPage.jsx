/**
 * LeasingContractsPage.jsx
 * Quản lý hợp đồng thuê — ported từ ProLeazing contracts/page.tsx
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, PlusCircle, Search, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

const CONTRACT_STATUS = {
  active:         { label: 'Đang hiệu lực', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  expiring_soon:  { label: 'Sắp hết hạn',  color: 'bg-amber-100 text-amber-700',   icon: AlertTriangle },
  expired:        { label: 'Đã hết hạn',   color: 'bg-slate-100 text-slate-600',   icon: Clock },
  terminated:     { label: 'Đã chấm dứt',  color: 'bg-rose-100 text-rose-700',     icon: XCircle },
};

const CONTRACTS = [
  {
    id: 1, code: 'HD-2024-001', category: 'residential',
    asset: { name: 'Căn 2PN Masteri Thảo Điền T3A-18', code: 'MST-T3A-18' },
    tenant: { name: 'Anh Hoàng Nam', phone: '0901234567' },
    owner: 'Chị Nguyễn Thanh',
    monthlyRent: 22000000, deposit: 44000000,
    startDate: '2024-02-01', endDate: '2026-05-08',
    status: 'expiring_soon', daysLeft: 8,
  },
  {
    id: 2, code: 'HD-2024-002', category: 'commercial',
    asset: { name: 'Shophouse Vinhomes GP SH-04', code: 'VGP-SH-04' },
    tenant: { name: 'Cty TNHH Đại Phúc', phone: '0282345678' },
    owner: 'Anh Minh Khoa',
    monthlyRent: 45000000, deposit: 90000000,
    startDate: '2024-05-01', endDate: '2026-05-15',
    status: 'expiring_soon', daysLeft: 15,
  },
  {
    id: 3, code: 'HD-2024-007', category: 'residential',
    asset: { name: 'Căn 1PN Vinhomes GP S1-12-05', code: 'VGP-S1-12-05' },
    tenant: { name: 'Chị Nguyễn Thị Mai', phone: '0912345678' },
    owner: 'Anh Phong Vũ',
    monthlyRent: 14500000, deposit: 29000000,
    startDate: '2024-08-01', endDate: '2026-12-31',
    status: 'active', daysLeft: 257,
  },
  {
    id: 4, code: 'HD-2024-012', category: 'residential',
    asset: { name: 'Căn 3PN Lumiere Riverside T5-18', code: 'LMR-T5-18' },
    tenant: { name: 'Anh Trần Văn Hùng', phone: '0934567890' },
    owner: 'Chị Bạch Tuyết',
    monthlyRent: 38000000, deposit: 76000000,
    startDate: '2025-01-01', endDate: '2027-01-01',
    status: 'active', daysLeft: 442,
  },
  {
    id: 5, code: 'HD-2023-031', category: 'commercial',
    asset: { name: 'Officetel The Sun Avenue O-208', code: 'TSA-O-208' },
    tenant: { name: 'Startup ABC Tech', phone: '0812345678' },
    owner: 'Cty BĐS Tân Phú',
    monthlyRent: 12000000, deposit: 24000000,
    startDate: '2023-05-01', endDate: '2024-04-30',
    status: 'expired', daysLeft: -18,
  },
];

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

export default function LeasingContractsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = CONTRACTS.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter;
    const matchSearch = !search || c.asset.name.toLowerCase().includes(search.toLowerCase()) || c.tenant.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = CONTRACTS.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const TABS = [
    { key: 'all', label: 'Tất cả', count: CONTRACTS.length },
    { key: 'active', label: 'Đang hiệu lực', count: counts.active || 0 },
    { key: 'expiring_soon', label: 'Sắp hết hạn', count: counts.expiring_soon || 0 },
    { key: 'expired', label: 'Đã hết hạn', count: counts.expired || 0 },
    { key: 'terminated', label: 'Đã chấm dứt', count: counts.terminated || 0 },
  ];

  return (
    <div className="space-y-5" data-testid="leasing-contracts-page">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Hợp đồng thuê
          </h1>
          <p className="text-sm text-slate-500">Quản lý toàn bộ hợp đồng cho thuê — Residential & Commercial</p>
        </div>
        <Link to="/leasing/contracts/new">
          <Button className="bg-[#316585] hover:bg-[#264f68] gap-2">
            <PlusCircle className="w-4 h-4" /> Tạo hợp đồng
          </Button>
        </Link>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1.5 border-b border-slate-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              filter === tab.key ? 'border-[#316585] text-[#316585]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`rounded-full text-[11px] px-1.5 py-0.5 font-semibold ${filter === tab.key ? 'bg-blue-50 text-[#316585]' : 'bg-slate-100 text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Tìm theo mã HĐ, tài sản, tên khách thuê..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(contract => {
          const st = CONTRACT_STATUS[contract.status];
          const StatusIcon = st.icon;
          return (
            <Card key={contract.id} className="border-slate-200 hover:border-[#316585]/30 hover:shadow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm font-mono text-slate-600">{contract.code}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {contract.category === 'residential' ? '🏠 Nhà ở' : '🏢 Thương mại'}
                      </span>
                      <Badge className={`text-xs ${st.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {st.label}
                        {contract.daysLeft > 0 && contract.status === 'expiring_soon' && ` · ${contract.daysLeft} ngày`}
                      </Badge>
                    </div>
                    <p className="font-semibold text-slate-900 mt-1">{contract.asset.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
                      <span>👤 {contract.tenant.name} · {contract.tenant.phone}</span>
                      <span>🏠 Chủ: {contract.owner}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#316585]">{formatCurrency(contract.monthlyRent)}/tháng</p>
                    <p className="text-xs text-slate-400">Cọc: {formatCurrency(contract.deposit)}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link to={`/leasing/contracts/${contract.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-7 text-xs">Xem chi tiết</Button>
                  </Link>
                  {contract.status === 'expiring_soon' && (
                    <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 px-3">Gia hạn</Button>
                  )}
                  <Link to={`/leasing/payments?contractId=${contract.id}`}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600">+ Thu tiền</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Không có hợp đồng</p>
          </div>
        )}
      </div>
    </div>
  );
}
