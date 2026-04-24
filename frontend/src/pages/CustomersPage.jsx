import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { customersAPI } from '@/lib/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserCircle,
  Phone,
  Mail,
  DollarSign,
  FileText,
} from 'lucide-react';
// Dynamic Data - Prompt 3/20
import { useMasterData } from '@/hooks/useDynamicData';
import { StatusBadge, DynamicFilterSelect } from '@/components/forms/DynamicSelect';

const DEMO_CUSTOMERS = [
  { id: 'customer-1', full_name: 'Nguyễn Thành Long', address: 'Thủ Đức, TP.HCM', phone_masked: '0901***567', email: 'long@example.com', segment: 'vip', total_deals: 2, total_value: 6200000000, created_at: new Date().toISOString() },
  { id: 'customer-2', full_name: 'Phạm Hương Giang', address: 'Quận 7, TP.HCM', phone_masked: '0912***678', email: 'giang@example.com', segment: 'premium', total_deals: 1, total_value: 2850000000, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'customer-3', full_name: 'Lê Hoàng Việt', address: 'Bình Dương', phone_masked: '0987***321', email: 'viet@example.com', segment: 'standard', total_deals: 1, total_value: 1980000000, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  
  // Dynamic Master Data - Prompt 3/20
  const { getLabel: getSegmentLabel, getColor: getSegmentColor } = useMasterData('lead_segments');

  const loadCustomers = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (segmentFilter) params.segment = segmentFilter;
      const response = await customersAPI.getAll(params);
      const payload = Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_CUSTOMERS;
      setCustomers(payload.filter((customer) => {
        const matchesSegment = !segmentFilter || customer.segment === segmentFilter;
        const q = search?.toLowerCase?.() || '';
        const matchesSearch = !q || customer.full_name?.toLowerCase().includes(q) || customer.email?.toLowerCase().includes(q);
        return matchesSegment && matchesSearch;
      }));
    } catch (error) {
      setCustomers(DEMO_CUSTOMERS.filter((customer) => {
        const matchesSegment = !segmentFilter || customer.segment === segmentFilter;
        const q = search?.toLowerCase?.() || '';
        const matchesSearch = !q || customer.full_name?.toLowerCase().includes(q) || customer.email?.toLowerCase().includes(q);
        return matchesSegment && matchesSearch;
      }));
      toast.error('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, [search, segmentFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="customers-page">
      <PageHeader
        title="Khách hàng"
        subtitle="Quản lý thông tin khách hàng đã chốt"
        breadcrumbs={[
          { label: 'CRM', path: '/crm/contacts' },
          { label: 'Khách hàng', path: '/customers' },
        ]}
        onSearch={setSearch}
        searchPlaceholder="Tìm kiếm khách hàng..."
        showNotifications={true}
        rightContent={
          <DynamicFilterSelect
            source="lead_segments"
            value={segmentFilter}
            onValueChange={setSegmentFilter}
            placeholder="Phân khúc"
            allLabel="Tất cả phân khúc"
            className="w-[180px]"
            testId="segment-filter"
          />
        }
      />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#316585]/10 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-[#316585]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
                <p className="text-sm text-slate-500">Tổng khách hàng</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {customers.reduce((sum, c) => sum + c.total_deals, 0)}
                </p>
                <p className="text-sm text-slate-500">Tổng giao dịch</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(customers.reduce((sum, c) => sum + c.total_value, 0))}
                </p>
                <p className="text-sm text-slate-500">Tổng giá trị</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {customers.length > 0 ? formatCurrency(customers.reduce((sum, c) => sum + c.total_value, 0) / customers.length) : '0'}
                </p>
                <p className="text-sm text-slate-500">Giá trị TB</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-slate-700">Khách hàng</TableHead>
                  <TableHead className="font-bold text-slate-700">Liên hệ</TableHead>
                  <TableHead className="font-bold text-slate-700">Phân khúc</TableHead>
                  <TableHead className="font-bold text-slate-700">Số giao dịch</TableHead>
                  <TableHead className="font-bold text-slate-700">Tổng giá trị</TableHead>
                  <TableHead className="font-bold text-slate-700">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] font-medium">
                          {customer.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{customer.full_name}</p>
                          {customer.address && (
                            <p className="text-xs text-slate-500">{customer.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-3 h-3" />
                          {customer.phone_masked}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Dynamic Segment Badge - Prompt 3/20 */}
                      {customer.segment ? (
                        <StatusBadge source="lead_segments" code={customer.segment} />
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.total_deals} giao dịch</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-[#316585]">
                      {formatCurrency(customer.total_value)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {formatDate(customer.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
