import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ShieldCheck, Wallet } from 'lucide-react';

const contractGroups = [
  {
    title: 'Hợp đồng cần xử lý ngay',
    description: 'Những hợp đồng sale nên mở trước trong ngày.',
    items: [
      {
        customer: 'Nguyễn Anh Thư',
        status: 'Chờ xác nhận cọc',
        note: 'Khách đã xem đủ pháp lý, chỉ còn chốt lịch ký.',
      },
      {
        customer: 'Lê Minh Huy',
        status: 'Thiếu hồ sơ',
        note: 'Cần bổ sung giấy tờ và cập nhật CRM trước khi trình ký.',
      },
      {
        customer: 'Trần Văn Khoa',
        status: 'Chờ thanh toán đợt 1',
        note: 'Khách cần gửi lại chính sách thanh toán và bảng giá cuối.',
      },
    ],
  },
];

const summaries = [
  { label: 'Chờ ký', value: 3, tone: 'bg-amber-50 text-amber-700' },
  { label: 'Thiếu hồ sơ', value: 2, tone: 'bg-rose-50 text-rose-700' },
  { label: 'Chờ thanh toán', value: 4, tone: 'bg-blue-50 text-blue-700' },
];

export default function SalesContractsPage() {
  return (
    <div className="space-y-6 p-6" data-testid="sales-contracts-page">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hợp đồng của tôi</h1>
          <p className="mt-1 text-slate-500">
            Chỉ giữ đúng những hợp đồng sale đang theo, cần bổ sung, cần ký hoặc cần theo thanh toán.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/contracts">
            <Button size="sm" variant="outline">Mở danh sách đầy đủ</Button>
          </Link>
          <Link to="/sales/product-center?tab=phap-ly">
            <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]">Mở pháp lý dự án</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaries.map((item) => (
          <Card key={item.label} className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{item.label}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">{item.value}</p>
                <Badge className={item.tone}>{item.label}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contractGroups.map((group) => (
        <Card key={group.title} className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#316585]" />
              {group.title}
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {group.items.map((item) => (
              <div key={`${item.customer}-${item.status}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">{item.customer}</p>
                <p className="mt-2 text-sm font-medium text-[#316585]">{item.status}</p>
                <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/contracts">
                    <Button size="sm" variant="outline">Mở hợp đồng</Button>
                  </Link>
                  <Link to="/sales/product-center?tab=phap-ly">
                    <Button size="sm" variant="outline">Pháp lý</Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#316585]" />
              <div>
                <p className="font-semibold text-slate-900">Việc nên làm ngay</p>
                <p className="text-sm text-slate-500">Bổ sung hồ sơ thiếu trước, rồi mới đẩy sang bước ký.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-[#316585]" />
              <div>
                <p className="font-semibold text-slate-900">Theo dõi tiền về</p>
                <p className="text-sm text-slate-500">Hợp đồng nào chậm thanh toán thì bám lại khách ngay trong ngày.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
