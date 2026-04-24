import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Globe, PenSquare, Sparkles } from 'lucide-react';

const tabs = [
  { key: 'kenh-cua-toi', label: 'Kênh của tôi' },
  { key: 'noi-dung', label: 'Nội dung để đăng' },
  { key: 'bieu-mau', label: 'Biểu mẫu lấy khách' },
  { key: 'ai', label: 'AI hỗ trợ bán hàng' },
];

export default function SalesChannelCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kenh-cua-toi';

  const content = {
    'kenh-cua-toi': {
      title: 'Kênh của tôi',
      description: 'Quản lý các kênh cá nhân mà sale đang dùng để kéo khách.',
      actionNote: 'Mở đúng kênh đang ra khách tốt nhất để ưu tiên đẩy tiếp.',
      items: [
        { title: 'Nguồn khách theo kênh', note: 'Biết kênh nào ra khách tốt nhất.', actions: [{ label: 'Mở kênh của tôi', link: '/marketing/sources' }] },
        { title: 'Kênh đang hiệu quả nhất', note: 'Facebook cá nhân và Zalo đang ra lead tốt trong tuần.', actions: [{ label: 'Xem nguồn khách', link: '/marketing/sources' }] },
      ],
    },
    'noi-dung': {
      title: 'Nội dung để đăng',
      description: 'Mẫu bài đăng, video, nội dung công ty cấp để sale dùng ngay.',
      actionNote: 'Lấy nhanh nội dung phù hợp để đăng ngay trong ngày.',
      items: [
        { title: 'Lịch nội dung bán hàng', note: 'Chọn nhanh nội dung phù hợp từng dự án.', actions: [{ label: 'Mở nội dung', link: '/communications/content' }] },
        { title: 'Bài đăng có sẵn', note: 'Có caption, hình và video ngắn để sale dùng luôn.', actions: [{ label: 'Lấy nội dung', link: '/communications/content' }] },
      ],
    },
    'bieu-mau': {
      title: 'Biểu mẫu lấy khách',
      description: 'Form lấy khách từ landing page, link cá nhân và chiến dịch.',
      actionNote: 'Mở biểu mẫu đang chạy để kiểm tra khách mới về trong ngày.',
      items: [
        { title: 'Form lấy khách', note: 'Dùng để kéo khách về hệ thống và giao cho chính sale.', actions: [{ label: 'Mở biểu mẫu', link: '/communications/forms' }] },
        { title: 'Landing page cá nhân', note: 'Dùng để gửi khách hoặc chạy quảng cáo nhẹ.', actions: [{ label: 'Mở landing page', link: '/communications/forms' }] },
      ],
    },
    'ai': {
      title: 'AI hỗ trợ bán hàng',
      description: 'Gợi ý cách đăng, nhắc follow-up và tự động hóa thao tác lặp lại.',
      actionNote: 'Dùng AI để biết hôm nay nên đăng gì, follow ai, đẩy kênh nào.',
      items: [
        { title: 'AI hỗ trợ bán hàng', note: 'Xem gợi ý hành động tiếp theo cho từng kênh.', actions: [{ label: 'Mở AI hỗ trợ', link: '/communications/automation' }] },
        { title: 'Gợi ý đăng hôm nay', note: 'AI nhắc nên đăng dự án nào, lúc nào, cho nhóm khách nào.', actions: [{ label: 'Xem gợi ý AI', link: '/communications/automation' }] },
      ],
    },
  }[activeTab];

  return (
    <div className="space-y-6 p-6" data-testid="sales-channel-center-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trung tâm kênh bán hàng</h1>
        <p className="mt-1 text-slate-500">Nơi sale quản lý kênh cá nhân, nội dung để đăng, form lấy khách và AI hỗ trợ bán hàng.</p>
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
            <Globe className="h-5 w-5 text-[#316585]" />
            {content.title}
          </CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[#316585]/15 bg-[#316585]/[0.04] p-4">
            <p className="text-sm font-semibold text-slate-900">Việc nên làm ngay</p>
            <p className="mt-1 text-sm text-slate-600">{content.actionNote}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {content.items.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.actions.map((action) => (
                    <Link key={action.label} to={action.link}>
                      <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]">{action.label}</Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
