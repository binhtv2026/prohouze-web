import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Flame, Link as LinkIcon, Download, Share2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

const tabs = [
  { key: 'du-an', label: 'Dự án đang bán' },
  { key: 'san-pham-hot', label: 'Sản phẩm nổi bật' },
  { key: 'bang-gia', label: 'Bảng giá' },
  { key: 'so-do', label: '🏢 Sơ đồ căn hộ', isLink: true, href: '/sales/floor-plan' },
  { key: 'chinh-sach', label: 'Chính sách bán hàng' },
  { key: 'phap-ly', label: 'Pháp lý dự án' },
  { key: 'tai-lieu', label: 'Tài liệu gửi khách', isLink: true, href: '/sales/documents' },
];

export default function SalesProductCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'du-an';

  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleShare = async (url, title) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Gửi anh/chị tài liệu: ${title}`,
          url
        });
      } catch (err) {
        console.error('Lỗi khi share:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Đã copy đường dẫn tài liệu!');
    }
  };

  const content = {
    'du-an': {
      title: 'Dự án đang bán',
      description: 'Tổng hợp các dự án chính thức đang được phân phối.',
      actionNote: 'Mở nhanh giỏ hàng để tư vấn khách hàng chính xác nhất.',
      quickLinks: [
        { label: 'Giỏ hàng tổng', link: '/sales/catalog' },
      ],
      items: [
        {
          title: 'Nobu Residences Danang',
          note: '264 căn thương hiệu Nobu - Cam kết lợi nhuận 6%/năm.',
          actions: [
            { label: 'Mở giỏ hàng', link: '/sales/catalog' },
          ],
        },
        {
          title: 'Sun Symphony Residence',
          note: '1.373 căn bên bờ sông Hàn - Chiết khấu lên đến 9.5%.',
          actions: [
            { label: 'Mở giỏ hàng', link: '/sales/catalog' },
          ],
        },
      ],
    },
    'san-pham-hot': {
      title: 'Sản phẩm nổi bật',
      description: 'Các quỹ căn đẹp, góc view xuất sắc đang mở bán.',
      actionNote: 'Ưu tiên báo khách các căn góc, view biển/sông để dễ chốt.',
      quickLinks: [
        { label: 'Xem sản phẩm', link: '/sales/catalog' },
      ],
      items: [
        {
          title: '2PN View Kép - Nobu Danang',
          note: 'Tầm nhìn trực diện biển Mỹ Khê và thành phố.',
          actions: [
            { label: 'Xem chi tiết', link: '/sales/catalog' },
          ],
        },
        {
          title: 'Penthouse View Sông - SSR',
          note: 'Căn hộ định danh, 329m2 đẳng cấp.',
          actions: [
            { label: 'Xem chi tiết', link: '/sales/catalog' },
          ],
        },
      ],
    },
    'bang-gia': {
      title: 'Bảng giá kinh doanh',
      description: 'Cập nhật giá bán và trạng thái mới nhất từ chủ đầu tư.',
      actionNote: 'Trạng thái và giá bán trên catalog là real-time.',
      quickLinks: [
        { label: 'Kiểm tra tỷ giá', link: '/sales/catalog' },
      ],
      items: [
        {
          title: 'Bảng giá Nobu Danang',
          note: 'Đơn giá quy đổi tiền Việt (Đã VAT & KPBT).',
          actions: [
            { label: 'Mở bảng giá', link: '/sales/catalog' },
          ],
        },
        {
          title: 'Bảng giá Sun Symphony',
          note: 'Đang mở cọc thiện chí, giá Rumor.',
          actions: [
            { label: 'Mở bảng giá', link: '/sales/catalog' },
          ],
        },
      ],
    },
    'chinh-sach': {
      title: 'Chính sách & Hoa hồng',
      description: 'Tài liệu CSBH và cơ chế chiết khấu/hoa hồng.',
      actionNote: 'Kiểm tra kỹ các phương án thanh toán để báo khách lợi ích tốt nhất.',
      quickLinks: [
        { label: 'Sale Kit', link: '/sales/catalog' },
      ],
      items: [
        {
          title: 'CSBH Nobu Danang',
          note: 'Cam kết 6% trong 5 năm, linh hoạt dòng tiền.',
          actions: [
            { label: 'Xem chính sách', link: '/sales/catalog' },
          ],
        },
        {
          title: 'CSBH Sun Symphony',
          note: 'Thanh toán sớm chiết khấu 9.5%, vay hỗ trợ gốc lãi.',
          actions: [
            { label: 'Xem chính sách', link: '/sales/catalog' },
          ],
        },
      ],
    },
    'phap-ly': {
      title: 'Pháp lý dự án',
      description: 'Bộ chứng từ, giấy phép xây dựng và HĐMB mẫu.',
      actionNote: 'Gửi pháp lý khi khách hàng yêu cầu chứng tỏ mức độ quan tâm cao.',
      quickLinks: [
        { label: 'Giỏ hàng DA', link: '/sales/catalog' },
      ],
      items: [
        {
          title: 'Hồ sơ pháp lý Nobu Danang',
          note: 'Quyết định 1/500, PCCC, và hợp đồng khai thác.',
          actions: [
            { label: 'Nhận tài liệu', link: '/sales/catalog' },
          ],
        },
        {
          title: 'Hồ sơ pháp lý Sun Symphony',
          note: 'Toàn bộ quy hoạch 1/500 và sổ tổng dự án.',
          actions: [
            { label: 'Nhận tài liệu', link: '/sales/catalog' },
          ],
        },
      ],
    },
    'tai-lieu': {
      title: 'Tài liệu gửi khách (Sale Kit)',
      description: 'Slide định hướng, tờ rơi quy hoạch, thiết kế 3D. Mở xem trực tiếp trong App hoặc Chia sẻ (Share) qua Zalo/Message.',
      actionNote: 'Sử dụng hình ảnh và concept art để tăng cảm xúc chốt deal.',
      quickLinks: [],
      items: [
        {
          title: 'Brochure Tổng Thể Nobu Danang',
          note: 'Thông tin chung, vị trí, tiện ích nổi bật của Nobu.',
          driveUrl: 'https://docs.google.com/presentation/d/e/2PACX-1vTIfx2_0G4f1A3U9-nIfU-k8O1VxtI2x_B/embed?start=false&loop=false&delayms=3000',
          shareUrl: 'https://docs.google.com/presentation/d/e/2PACX-1vTIfx2_0G4f1A3U9-nIfU-k8O1VxtI2x_B',
          actions: [],
        },
        {
          title: 'Mặt Bằng Tầng Sun Symphony',
          note: 'Mặt bằng chi tiết các tòa, căn hộ điển hình.',
          driveUrl: 'https://docs.google.com/presentation/d/e/2PACX-1vTIfx2_0G4f1A3U9-nIfU-k8O1VxtI2x_B/embed?start=false&loop=false&delayms=3000',
          shareUrl: 'https://docs.google.com/presentation/d/e/2PACX-1vTIfx2_0G4f1A3U9-nIfU-k8O1VxtI2x_B',
          actions: [],
        },
      ],
    },
  }[activeTab];

  return (
    <div className="space-y-6 p-6" data-testid="sales-product-center-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trung tâm sản phẩm</h1>
        <p className="mt-1 text-slate-500">Tập trung toàn bộ dự án, hàng ngon, chính sách, pháp lý và tài liệu gửi khách cho sale.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) =>
          tab.isLink ? (
            <Link key={tab.key} to={tab.href}>
              <Button size="sm" variant="outline" className="border-[#316585] text-[#316585] hover:bg-[#316585] hover:text-white">
                {tab.label}
              </Button>
            </Link>
          ) : (
            <Button
              key={tab.key}
              size="sm"
              variant={activeTab === tab.key ? 'default' : 'outline'}
              className={activeTab === tab.key ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
              onClick={() => setSearchParams({ tab: tab.key })}
            >
              {tab.label}
            </Button>
          )
        )}
      </div>


      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#316585]" />
            {content.title}
          </CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[#316585]/15 bg-[#316585]/[0.04] p-4">
            <p className="text-sm font-semibold text-slate-900">Việc nên làm ngay</p>
            <p className="mt-1 text-sm text-slate-600">{content.actionNote}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {content.quickLinks.map((item) => (
                <Link key={item.label} to={item.link}>
                  <Button size="sm" variant="outline">{item.label}</Button>
                </Link>
              ))}
            </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            {content.items.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <Badge className="bg-slate-100 text-slate-700">Sale dùng ngay</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 mb-4">{item.note}</p>
                </div>
                
                {activeTab === 'tai-lieu' ? (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Button
                      size="sm"
                      className="bg-[#316585] hover:bg-[#264f68] flex items-center gap-1.5"
                      onClick={() => setSelectedDoc(item)}
                    >
                      <Eye className="w-4 h-4" />
                      Mở xem ngay
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1.5 border-[#316585] text-[#316585]"
                      onClick={() => handleShare(item.shareUrl || item.driveUrl, item.title)}
                    >
                      <Share2 className="w-4 h-4" />
                      Gửi cho khách
                    </Button>
                  </div>
                ) : (
                  <div className="mt-auto flex flex-wrap gap-2">
                    {item.actions?.map((action) => (
                      <Link key={action.label} to={action.link}>
                        <Button
                          size="sm"
                          variant={action.label === item.actions[0].label ? 'default' : 'outline'}
                          className={action.label === item.actions[0].label ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
                        >
                          {action.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── DOCUMENT PREVIEW MODAL ── */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-[95vw] w-[800px] h-[90vh] max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-white rounded-3xl">
          <DialogHeader className="p-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
            <div className="flex items-start justify-between pr-8">
              <div>
                <DialogTitle className="text-lg leading-tight text-slate-800">{selectedDoc?.title}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  {selectedDoc?.note}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 w-full bg-slate-100 relative">
            {selectedDoc?.driveUrl ? (
              <iframe 
                src={selectedDoc.driveUrl} 
                className="absolute inset-0 w-full h-full border-0" 
                allow="autoplay"
                title={selectedDoc?.title}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-2 opacity-50" />
                <p>Không có đường dẫn tài liệu</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
            <Button variant="outline" className="rounded-full px-6" onClick={() => setSelectedDoc(null)}>
              Đóng
            </Button>
            <Button 
              className="bg-[#316585] text-white hover:bg-[#264f68] rounded-full px-6 flex items-center gap-2"
              onClick={() => handleShare(selectedDoc.shareUrl || selectedDoc.driveUrl, selectedDoc.title)}
            >
              <Share2 className="w-4 h-4" />
              Gửi tài liệu (Mạng xã hội / Copy)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
