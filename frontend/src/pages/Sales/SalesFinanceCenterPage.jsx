import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, DollarSign, Wallet } from 'lucide-react';

const tabs = [
  { key: 'doanh-thu', label: 'Doanh thu của tôi' },
  { key: 'hoa-hong', label: 'Hoa hồng của tôi' },
  { key: 'luong-thuong', label: 'Lương / thưởng của tôi' },
];

export default function SalesFinanceCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'doanh-thu';

  const content = {
    'doanh-thu': {
      title: 'Doanh thu của tôi',
      description: 'Xem kết quả doanh số và số tiền đang tạo ra.',
      link: '/finance/my-income',
      cta: 'Mở doanh thu của tôi',
      note: 'Theo dõi doanh số, mục tiêu tháng và tiền dự kiến.',
      action: 'Xem ngay doanh số đang chạy trong tháng và còn thiếu bao nhiêu để chạm mục tiêu.',
    },
    'hoa-hong': {
      title: 'Hoa hồng của tôi',
      description: 'Xem commission, thưởng nóng và thu nhập theo giao dịch.',
      link: '/finance/my-income',
      cta: 'Mở hoa hồng của tôi',
      note: 'Biết ngay nếu chốt thêm 1 deal thì cộng thêm bao nhiêu.',
      action: 'Mở hoa hồng để biết chốt thêm 1 deal thì tiền tăng bao nhiêu.',
    },
    'luong-thuong': {
      title: 'Lương / thưởng của tôi',
      description: 'Xem lương, thưởng KPI và các khoản đang chờ chi.',
      link: '/payroll/salary',
      cta: 'Mở lương / thưởng',
      note: 'Dành riêng cho tài chính cá nhân của sale.',
      action: 'Kiểm tra các khoản thưởng, lương và tiền chờ chi.',
    },
  }[activeTab];

  return (
    <div className="space-y-6 p-6" data-testid="sales-finance-center-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trung tâm tài chính của tôi</h1>
        <p className="mt-1 text-slate-500">Sale chỉ cần nhìn đúng tiền của mình: doanh thu, hoa hồng và lương thưởng.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? 'default' : 'outline'}
            className={activeTab === tab.key ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
            onClick={() => setSearchParams({ tab: tab.key })}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#316585]" />
            {content.title}
          </CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Doanh số đang ghi nhận</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">2,4 tỷ</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Hoa hồng tạm tính</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">28,8 triệu</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Khoản thưởng gần nhất</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">3 triệu</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#316585]/15 bg-[#316585]/[0.04] p-4">
            <p className="text-sm font-semibold text-slate-900">Việc nên làm ngay</p>
            <p className="mt-1 text-sm text-slate-600">{content.action}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">{content.note}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={content.link}>
                <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]">{content.cta}</Button>
              </Link>
              <Link to="/sales">
                <Button size="sm" variant="outline">Về bảng điều hành sale</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
