import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Lock, Database, Bell, UserCheck, Globe, Mail, Phone } from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';

const SECTIONS = [
  {
    icon: Database,
    title: '1. Thông tin chúng tôi thu thập',
    content: [
      {
        subtitle: 'Thông tin bạn cung cấp trực tiếp',
        text: 'Họ tên, địa chỉ email, số điện thoại, thông tin nghề nghiệp khi bạn đăng ký tài khoản, liên hệ tư vấn, hoặc sử dụng dịch vụ của ProHouze.',
      },
      {
        subtitle: 'Thông tin sử dụng dịch vụ',
        text: 'Lịch sử tìm kiếm bất động sản, danh sách dự án quan tâm, lịch hẹn tư vấn, tương tác với nội dung trên nền tảng và các giao dịch thực hiện qua hệ thống.',
      },
      {
        subtitle: 'Thông tin kỹ thuật',
        text: 'Địa chỉ IP, loại trình duyệt, hệ điều hành, thời gian truy cập, dữ liệu phiên làm việc và thông tin nhận dạng thiết bị được thu thập tự động khi bạn sử dụng dịch vụ.',
      },
    ],
  },
  {
    icon: Eye,
    title: '2. Mục đích sử dụng thông tin',
    content: [
      {
        subtitle: 'Cung cấp và cải thiện dịch vụ',
        text: 'Xử lý yêu cầu tư vấn, kết nối bạn với chuyên gia phù hợp, cá nhân hóa trải nghiệm tìm kiếm bất động sản và liên tục nâng cao chất lượng nền tảng ProHouze.',
      },
      {
        subtitle: 'Liên lạc và thông báo',
        text: 'Gửi thông tin về dự án mới, cập nhật thị trường BĐS, cảnh báo giá và nội dung liên quan đến sở thích đã đăng ký của bạn. Bạn có thể hủy đăng ký bất kỳ lúc nào.',
      },
      {
        subtitle: 'Pháp lý và bảo mật',
        text: 'Phòng chống gian lận, tuân thủ nghĩa vụ pháp lý theo quy định pháp luật Việt Nam, bảo vệ quyền lợi hợp pháp của ProHouze và người dùng.',
      },
    ],
  },
  {
    icon: Lock,
    title: '3. Bảo mật thông tin',
    content: [
      {
        subtitle: 'Biện pháp kỹ thuật',
        text: 'Toàn bộ dữ liệu được mã hóa bằng SSL/TLS trong quá trình truyền tải. Dữ liệu lưu trữ áp dụng mã hóa AES-256. Hệ thống được bảo vệ bởi tường lửa và kiểm tra bảo mật định kỳ.',
      },
      {
        subtitle: 'Kiểm soát truy cập',
        text: 'Chỉ nhân viên được ủy quyền mới có thể truy cập thông tin cá nhân của bạn. Mọi truy cập đều được ghi log và kiểm soát theo cơ chế phân quyền nghiêm ngặt.',
      },
      {
        subtitle: 'Ứng phó sự cố',
        text: 'Trong trường hợp xảy ra sự cố bảo mật ảnh hưởng đến dữ liệu của bạn, ProHouze cam kết thông báo trong vòng 72 giờ theo quy định.',
      },
    ],
  },
  {
    icon: UserCheck,
    title: '4. Quyền của người dùng',
    content: [
      {
        subtitle: 'Quyền truy cập và chỉnh sửa',
        text: 'Bạn có quyền yêu cầu xem, chỉnh sửa thông tin cá nhân của mình bất kỳ lúc nào thông qua phần Hồ sơ tài khoản hoặc liên hệ trực tiếp với chúng tôi.',
      },
      {
        subtitle: 'Quyền xóa dữ liệu',
        text: 'Bạn có quyền yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân. ProHouze sẽ xử lý yêu cầu trong vòng 30 ngày làm việc, ngoại trừ dữ liệu cần lưu giữ theo yêu cầu pháp lý.',
      },
      {
        subtitle: 'Quyền phản đối xử lý',
        text: 'Bạn có quyền phản đối việc xử lý dữ liệu cá nhân vì mục đích marketing trực tiếp bất kỳ lúc nào, bao gồm cả hủy nhận email thông báo.',
      },
    ],
  },
  {
    icon: Globe,
    title: '5. Chia sẻ thông tin với bên thứ ba',
    content: [
      {
        subtitle: 'Đối tác kinh doanh',
        text: 'ProHouze có thể chia sẻ thông tin với chủ đầu tư và đại lý bất động sản được ủy quyền để phục vụ yêu cầu tư vấn của bạn. Việc chia sẻ chỉ xảy ra khi bạn đồng ý hoặc khởi tạo liên lạc.',
      },
      {
        subtitle: 'Nhà cung cấp dịch vụ',
        text: 'Chúng tôi sử dụng các nhà cung cấp dịch vụ bên thứ ba (lưu trữ, phân tích, thanh toán) đã ký kết thỏa thuận bảo mật dữ liệu với ProHouze.',
      },
      {
        subtitle: 'Không bán dữ liệu',
        text: 'ProHouze cam kết KHÔNG bán, cho thuê hoặc trao đổi thông tin cá nhân của bạn với bên thứ ba vì mục đích thương mại.',
      },
    ],
  },
  {
    icon: Bell,
    title: '6. Cookie và công nghệ theo dõi',
    content: [
      {
        subtitle: 'Cookie cần thiết',
        text: 'Một số cookie cần thiết cho hoạt động cơ bản của trang web (duy trì phiên đăng nhập, bảo mật). Các cookie này không thể tắt.',
      },
      {
        subtitle: 'Cookie phân tích',
        text: 'Chúng tôi sử dụng Google Analytics và công cụ tương tự để hiểu cách người dùng tương tác với nền tảng, từ đó cải thiện trải nghiệm. Bạn có thể từ chối qua cài đặt trình duyệt.',
      },
      {
        subtitle: 'Quản lý Cookie',
        text: 'Bạn có thể kiểm soát cookie qua cài đặt trình duyệt. Tuy nhiên, việc vô hiệu hóa một số cookie có thể ảnh hưởng đến tính năng của dịch vụ.',
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50" data-testid="privacy-policy-page">
      <WebsiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3d4f] to-[#316585] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Shield className="w-4 h-4" />
            Chính sách bảo mật
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Chính sách Bảo mật & Quyền riêng tư
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            ProHouze cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn.
            Tài liệu này giải thích rõ cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu.
          </p>
          <p className="text-white/50 text-sm mt-4">
            Cập nhật lần cuối: 24 tháng 4 năm 2026 · Áp dụng từ: 01 tháng 1 năm 2026
          </p>
        </div>
      </section>

      {/* Summary cards */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: 'Dữ liệu được mã hóa', desc: 'SSL/TLS + AES-256 cho mọi dữ liệu' },
              { icon: UserCheck, title: 'Không bán dữ liệu', desc: 'Thông tin của bạn không bao giờ bị bán' },
              { icon: Shield, title: 'Quyền kiểm soát đầy đủ', desc: 'Xem, chỉnh sửa hoặc xóa dữ liệu bất kỳ lúc nào' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-[#316585]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#316585]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#316585] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                </div>
                <div className="space-y-5">
                  {section.content.map(item => (
                    <div key={item.subtitle} className="border-l-2 border-[#316585]/20 pl-4">
                      <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.subtitle}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Contact */}
          <div className="bg-gradient-to-r from-[#1e3d4f] to-[#316585] rounded-2xl p-8 text-white">
            <h2 className="text-xl font-bold mb-2">Liên hệ về quyền riêng tư</h2>
            <p className="text-white/70 mb-6 text-sm">
              Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, hãy liên hệ:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-white/60" />
                <span>privacy@prohouze.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-white/60" />
                <span>1800 6868 (miễn phí)</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/contact')}
                className="bg-white text-[#316585] hover:bg-slate-100 font-semibold"
              >
                Liên hệ chúng tôi
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/terms')}
                className="border-white text-white hover:bg-white/10"
              >
                Xem Điều khoản dịch vụ
              </Button>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
