import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, CheckSquare, AlertTriangle, Scale, Globe, Mail } from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';

const SECTIONS = [
  {
    icon: CheckSquare,
    title: '1. Chấp nhận Điều khoản',
    text: 'Bằng cách truy cập và sử dụng nền tảng ProHouze (bao gồm website prohouze.com, ứng dụng di động iOS và Android), bạn đồng ý bị ràng buộc bởi các Điều khoản Dịch vụ này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi. ProHouze có thể cập nhật các điều khoản này và sẽ thông báo qua email hoặc thông báo trong ứng dụng.',
  },
  {
    icon: Globe,
    title: '2. Mô tả Dịch vụ',
    text: 'ProHouze là nền tảng công nghệ bất động sản cung cấp: (i) Thông tin và cẩm nang về thị trường BĐS sơ cấp; (ii) Kết nối người mua với chuyên gia tư vấn; (iii) Hệ thống CRM và quản lý bán hàng cho doanh nghiệp BĐS; (iv) Ứng dụng di động hỗ trợ quy trình giao dịch bất động sản. Chúng tôi không phải là môi giới bất động sản được cấp phép và không chịu trách nhiệm về quyết định đầu tư của người dùng.',
  },
  {
    icon: CheckSquare,
    title: '3. Tài khoản Người dùng',
    text: 'Để sử dụng đầy đủ tính năng, bạn cần tạo tài khoản và cung cấp thông tin chính xác, đầy đủ và cập nhật. Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động dưới tài khoản của mình. ProHouze có quyền tạm khóa hoặc xóa tài khoản vi phạm điều khoản sử dụng mà không cần thông báo trước.',
  },
  {
    icon: AlertTriangle,
    title: '4. Hành vi bị cấm',
    text: 'Người dùng không được: (i) Đăng thông tin sai lệch, gian lận về BĐS; (ii) Sử dụng dịch vụ cho mục đích bất hợp pháp; (iii) Thu thập dữ liệu người dùng khác trái phép; (iv) Phá hoại, làm gián đoạn hoạt động hệ thống; (v) Sao chép, phân phối nội dung độc quyền của ProHouze; (vi) Mạo danh cá nhân hoặc tổ chức khác.',
  },
  {
    icon: FileText,
    title: '5. Sở hữu Trí tuệ',
    text: 'Toàn bộ nội dung trên nền tảng ProHouze bao gồm văn bản, hình ảnh, logo, giao diện, mã nguồn và dữ liệu là tài sản độc quyền của Công ty TNHH ANKAPU hoặc các đối tác được cấp phép. Nghiêm cấm sao chép, tái sử dụng dưới mọi hình thức mà không có sự đồng ý bằng văn bản từ ProHouze.',
  },
  {
    icon: Scale,
    title: '6. Giới hạn Trách nhiệm',
    text: 'ProHouze cung cấp thông tin BĐS "nguyên trạng" và không đảm bảo tính chính xác, đầy đủ của mọi dữ liệu niêm yết. Chúng tôi không chịu trách nhiệm về tổn thất tài chính phát sinh từ quyết định đầu tư dựa trên thông tin trên nền tảng. Mọi giao dịch BĐS cần được xác minh độc lập và có sự tư vấn pháp lý chuyên nghiệp.',
  },
  {
    icon: Globe,
    title: '7. Luật điều chỉnh',
    text: 'Điều khoản Dịch vụ này được điều chỉnh theo pháp luật Việt Nam. Mọi tranh chấp phát sinh được giải quyết tại Tòa án nhân dân thành phố Hồ Chí Minh. Ngôn ngữ chính thức của Điều khoản này là tiếng Việt. Trường hợp có sự khác biệt với bản dịch, bản tiếng Việt sẽ được áp dụng.',
  },
];

export default function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50" data-testid="terms-of-service-page">
      <WebsiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <FileText className="w-4 h-4" />
            Điều khoản dịch vụ
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Điều khoản Sử dụng Dịch vụ
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Điều khoản này quy định quyền và nghĩa vụ khi bạn sử dụng nền tảng ProHouze.
            Vui lòng đọc kỹ trước khi đăng ký.
          </p>
          <p className="text-white/40 text-sm mt-4">
            Cập nhật lần cuối: 24 tháng 4 năm 2026 · Áp dụng từ: 01 tháng 1 năm 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-bold text-slate-900">{section.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm">{section.text}</p>
              </div>
            );
          })}

          {/* Company info */}
          <div className="bg-slate-800 rounded-2xl p-7 text-white">
            <h2 className="font-bold text-lg mb-3">Thông tin Công ty</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-white/70 mb-6">
              <div><span className="text-white/50">Tên công ty:</span> Công ty TNHH ANKAPU</div>
              <div><span className="text-white/50">Mã số thuế:</span> 0123456789</div>
              <div><span className="text-white/50">Địa chỉ:</span> TP. Hồ Chí Minh, Việt Nam</div>
              <div><span className="text-white/50">Email pháp lý:</span> legal@prohouze.com</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/privacy')} className="bg-white text-slate-800 hover:bg-slate-100 font-semibold">
                Chính sách Bảo mật
              </Button>
              <Button variant="outline" onClick={() => navigate('/contact')} className="border-white/30 text-white hover:bg-white/10">
                <Mail className="w-4 h-4 mr-2" />
                Liên hệ pháp lý
              </Button>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
