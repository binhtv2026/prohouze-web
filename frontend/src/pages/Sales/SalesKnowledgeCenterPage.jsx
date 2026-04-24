/**
 * SalesKnowledgeCenterPage – Nâng cấp đầy đủ
 * - Kịch bản tư vấn: mẫu hội thoại xử lý từng tình huống khách hàng
 * - FAQ: câu hỏi thường gặp theo chủ đề
 * - Khóa học: danh sách module học theo dự án / kỹ năng
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  GraduationCap,
  MessageSquare,
  PlayCircle,
  Search,
  Star,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { key: 'tuvan', label: '💬 Kịch bản tư vấn', icon: MessageSquare },
  { key: 'faq', label: '❓ Câu hỏi thường gặp', icon: BookOpen },
  { key: 'khoahoc', label: '🎓 Khóa học', icon: GraduationCap },
];

// ===== KỊCH BẢN TƯ VẤN =====
const SCRIPTS = [
  {
    id: 's1',
    title: 'Khách hỏi giá nhưng chưa muốn mua',
    situation: 'Khách nói "Giá cao quá, để tôi suy nghĩ thêm"',
    category: 'Xử lý phản đối',
    level: 'hot',
    script: [
      { role: 'Khách', text: '"Nhìn giá cao quá, để tôi suy nghĩ thêm đã."' },
      { role: 'Sale', text: '"Dạ hoàn toàn hiểu. Anh/chị có thể cho em biết so với mức giá anh/chị đang kỳ vọng thì còn cách nhau bao nhiêu không ạ?"' },
      { role: 'Khách', text: '"Tôi nghĩ khoảng 200-300 triệu gì đó."' },
      { role: 'Sale', text: '"Vậy là khoảng 5-6% thôi ạ. Thực ra với chính sách hỗ trợ lãi suất hiện tại, nếu mình chọn đúng đợt, con số này có thể được bù lại đáng kể qua ưu đãi tài chính. Anh/chị có muốn em trình bày cụ thể không?"' },
    ],
    tips: ['Không bao giờ hạ giá ngay', 'Hỏi để hiểu khoảng cách cụ thể', 'Dùng chính sách tài chính để bridge gap'],
  },
  {
    id: 's2',
    title: 'Khách hỏi về pháp lý dự án',
    situation: 'Khách muốn biết pháp lý có đầy đủ không',
    category: 'Xây dựng niềm tin',
    level: 'warm',
    script: [
      { role: 'Khách', text: '"Dự án này pháp lý như thế nào? Sổ đỏ có không?"' },
      { role: 'Sale', text: '"Dạ, dự án đã có đầy đủ: Giấy phép xây dựng, quyết định chủ trương đầu tư, và chủ đầu tư đã cam kết bàn giao sổ trong vòng 12 tháng sau khi nhận nhà. Em có thể gửi ngay bộ hồ sơ pháp lý đầy đủ cho anh/chị xem."' },
      { role: 'Khách', text: '"Được, gửi cho tôi xem."' },
      { role: 'Sale', text: '"Dạ em gửi ngay. Anh/chị cho em xin SĐT hoặc Zalo để em gửi qua ạ? Sau khi anh/chị xem xong, nếu có câu hỏi gì em giải đáp ngay."' },
    ],
    tips: ['Luôn có sẵn link pháp lý để gửi ngay', 'Dùng cơ hội này để lấy thêm thông tin liên lạc', 'Gửi kèm FAQ pháp lý'],
  },
  {
    id: 's3',
    title: 'Khách so sánh với dự án khác',
    situation: 'Khách đang cân nhắc giữa dự án của mình và dự án đối thủ',
    category: 'Cạnh tranh',
    level: 'hot',
    script: [
      { role: 'Khách', text: '"Tôi đang xem thêm bên XYZ, giá họ rẻ hơn mà vị trí cũng tốt."' },
      { role: 'Sale', text: '"Dạ em biết dự án đó. Thực ra mỗi dự án có điểm mạnh riêng — anh/chị có thể nói thêm tiêu chí quan trọng nhất với mình là gì không ạ? Ví dụ ưu tiên vị trí, giá, hay tiện ích?"' },
      { role: 'Khách', text: '"Tôi cần giao thông tiện, gần trường học."' },
      { role: 'Sale', text: '"Vậy thì anh/chị đang đúng hướng với dự án này rồi ạ — chỉ 300m tới trường quốc tế ABC, và nằm ngay trục Metro. Bên XYZ cách trường khoảng 2km và chưa có metro. Em có thể làm bảng so sánh 2 dự án gửi anh/chị không?"' },
    ],
    tips: ['Không nói xấu đối thủ', 'Hiểu tiêu chí quyết định của khách', 'Làm nổi bật điểm vượt trội theo tiêu chí khách chọn'],
  },
  {
    id: 's4',
    title: 'Chốt hẹn xem nhà mẫu',
    situation: 'Khách đang tư vấn qua điện thoại, cần chốt hẹn',
    category: 'Chuyển bước',
    level: 'action',
    script: [
      { role: 'Sale', text: '"Anh/chị đã nghe qua thông tin dự án. Qua điện thoại thì khó hình dung đầy đủ — em mời anh/chị lên xem nhà mẫu trực tiếp một buổi, chỉ mất 45 phút thôi ạ, mình thấy thực tế sẽ quyết định chuẩn hơn rất nhiều."' },
      { role: 'Khách', text: '"Để xem lịch đã."' },
      { role: 'Sale', text: '"Dạ tốt. Anh/chị rảnh cuối tuần này không ạ? Em có thể sắp xếp sáng thứ 7 hoặc chiều CN cho mình. Và em sẽ chuẩn bị sẵn bảng giá, hồ sơ pháp lý và bảng tính tài chính theo yêu cầu của anh/chị."' },
    ],
    tips: ['Đừng hỏi "Có muốn xem không?" mà hỏi "Sáng hay chiều?"', 'Luôn đề xuất 2 lựa chọn cụ thể', 'Tạo giá trị cho buổi gặp'],
  },
];

// ===== FAQ =====
const FAQ_CATEGORIES = [
  {
    id: 'phap-ly',
    name: '📋 Pháp lý',
    questions: [
      {
        q: 'Sổ đỏ (Sổ hồng) sẽ cấp khi nào?',
        a: 'Thông thường 12-24 tháng sau khi bàn giao nhà. Từng dự án có cam kết cụ thể trong hợp đồng mua bán. Hãy kiểm tra điều khoản 4.2 trong HĐMB dự án.',
      },
      {
        q: 'Dự án đã có Giấy phép xây dựng chưa?',
        a: 'Luôn kiểm tra 3 loại giấy tờ: (1) Quyết định chủ trương đầu tư, (2) Giấy phép xây dựng, (3) Thông báo đủ điều kiện bán hàng từ Sở Xây dựng. Tất cả đều phải kiểm tra trực tiếp trên website Sở TNMT / Sở XD.',
      },
      {
        q: 'Đất dự án có đang bị thế chấp không?',
        a: 'Yêu cầu chủ đầu tư cung cấp văn bản xác nhận và kiểm tra tại Văn phòng đăng ký đất đai. Một số CĐT có thế chấp nhưng đã ký Thỏa thuận giải chấp trước bán hàng — cần đọc kỹ.',
      },
    ],
  },
  {
    id: 'tai-chinh',
    name: '💰 Tài chính & thanh toán',
    questions: [
      {
        q: 'Hỗ trợ lãi suất hoạt động như thế nào?',
        a: 'Chủ đầu tư trả thay lãi suất ngân hàng cho người mua trong một giai đoạn (thường 18-24 tháng). Khách hàng chỉ trả gốc. Sau giai đoạn đó, lãi suất thả nổi theo thị trường.',
      },
      {
        q: 'Vay được bao nhiêu % giá trị căn hộ?',
        a: 'Thông thường ngân hàng cho vay 70-80% giá trị BĐS. Với dự án có hợp tác ngân hàng chính thức, có thể vay đến 80-85% và lãi suất ưu đãi hơn.',
      },
      {
        q: 'Đặt cọc bao nhiêu và có hoàn lại không?',
        a: 'Thường từ 2-5% giá trị căn. Nếu khách hủy sau khi ký biên nhận cọc, thường mất cọc. Nếu CĐT vi phạm, phải hoàn cọc gấp đôi theo quy định.',
      },
    ],
  },
  {
    id: 'du-an',
    name: '🏢 Về dự án',
    questions: [
      {
        q: 'Tiến độ xây dựng có đảm bảo không?',
        a: 'Xem lịch sử các dự án trước của CĐT. Hỏi rõ penality clause nếu chậm bàn giao. Một số CĐT có bảo hiểm tiến độ từ ngân hàng bảo lãnh.',
      },
      {
        q: 'Phí quản lý sau khi nhận nhà là bao nhiêu?',
        a: 'Thông thường 5.000-15.000 VND/m²/tháng tùy dự án và tiện ích. Hỏi kỹ về phí trong 2 năm đầu và cơ chế tăng phí về sau.',
      },
      {
        q: 'Mua căn hộ để đầu tư cho thuê có lợi không?',
        a: 'Tỷ suất thuê thô dao động 4-7%/năm tại TP.HCM. Cần trừ đi phí quản lý, thuế, chi phí nội thất. Căn hộ gần trung tâm/tiện ích tốt cho rent yield cao hơn.',
      },
    ],
  },
];

// ===== KHÓA HỌC =====
const COURSES = [
  {
    id: 'c1',
    title: 'Nền tảng pháp lý BĐS sơ cấp',
    category: 'Kiến thức',
    level: 'Cơ bản',
    duration: '45 phút',
    lessons: 6,
    progress: 60,
    tag: 'Bắt buộc',
    tagColor: 'bg-red-100 text-red-700',
    description: 'Hiểu đúng về các loại giấy tờ pháp lý, quy trình công nhận quyền sở hữu và những điều cần kiểm tra trước khi tư vấn khách.',
  },
  {
    id: 'c2',
    title: 'Kỹ năng chốt sale & xử lý phản đối',
    category: 'Kỹ năng',
    level: 'Trung cấp',
    duration: '1h 20 phút',
    lessons: 10,
    progress: 30,
    tag: 'Hot',
    tagColor: 'bg-orange-100 text-orange-700',
    description: 'Các mẫu câu xử lý phản đối phổ biến, kỹ thuật dẫn dắt hội thoại và chốt hẹn gặp mặt hiệu quả.',
  },
  {
    id: 'c3',
    title: 'Dự án The Opus One — Kiến thức bán hàng',
    category: 'Dự án',
    level: 'Cơ bản',
    duration: '30 phút',
    lessons: 5,
    progress: 0,
    tag: 'Mới',
    tagColor: 'bg-blue-100 text-blue-700',
    description: 'Toàn bộ thông tin dự án, USP, bảng giá, chính sách và các câu hỏi thường gặp về The Opus One.',
  },
  {
    id: 'c4',
    title: 'Tài chính & Công cụ tính toán',
    category: 'Kiến thức',
    level: 'Trung cấp',
    duration: '55 phút',
    lessons: 8,
    progress: 100,
    tag: 'Hoàn thành',
    tagColor: 'bg-emerald-100 text-emerald-700',
    description: 'Cách tính lãi suất vay, hỗ trợ tài chính CĐT và trình bày phương án tài chính cho khách một cách rõ ràng.',
  },
  {
    id: 'c5',
    title: 'Marketing cá nhân & kéo khách qua mạng XH',
    category: 'Marketing',
    level: 'Cơ bản',
    duration: '40 phút',
    lessons: 6,
    progress: 75,
    tag: 'Phổ biến',
    tagColor: 'bg-violet-100 text-violet-700',
    description: 'Cách xây kênh Facebook, Zalo OA, TikTok để kéo lead chủ động và nuôi dưỡng khách tiềm năng.',
  },
];

function ScriptDialog({ script, onClose }) {
  const [copied, setCopied] = useState(false);
  
  function handleCopy() {
    const text = script.script.map(s => `${s.role}: ${s.text}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    toast.success('Đã copy kịch bản');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{script.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-slate-500 italic bg-slate-50 px-3 py-2 rounded-lg">
            📍 Tình huống: {script.situation}
          </div>
          
          <div className="space-y-3">
            {script.script.map((line, i) => (
              <div key={i} className={`flex gap-3 ${line.role === 'Sale' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  line.role === 'Sale' ? 'bg-[#316585] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {line.role === 'Sale' ? 'S' : 'K'}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  line.role === 'Sale' ? 'bg-[#316585] text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}>
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-800 mb-2">⚡ Tips áp dụng</p>
            <ul className="space-y-1">
              {script.tips.map((tip, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>{tip}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
            <Copy className="w-4 h-4" />
            {copied ? 'Đã copy!' : 'Copy kịch bản'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FAQAccordion({ categories }) {
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState('');

  function toggle(catId, qIdx) {
    const key = `${catId}-${qIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const filtered = categories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      !search || q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Tìm câu hỏi..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {filtered.map(cat => (
        <div key={cat.id}>
          <h3 className="text-sm font-bold text-slate-700 mb-2">{cat.name}</h3>
          <div className="space-y-1.5">
            {cat.questions.map((qa, i) => {
              const key = `${cat.id}-${i}`;
              const isOpen = openItems[key];
              return (
                <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggle(cat.id, i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-800">{qa.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-slate-600 bg-slate-50 border-t border-slate-100">
                      <p className="mt-3 leading-relaxed">{qa.a}</p>
                      <button
                        className="mt-3 flex items-center gap-1.5 text-xs text-[#316585] font-medium hover:underline"
                        onClick={() => { navigator.clipboard.writeText(qa.a).catch(()=>{}); toast.success('Đã copy câu trả lời'); }}
                      >
                        <Copy className="w-3 h-3" /> Copy để gửi khách
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CourseCard({ course }) {
  const isDone = course.progress === 100;
  return (
    <Card className={`border shadow-none ${isDone ? 'opacity-75' : 'hover:border-[#316585]/30'} transition-colors`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${course.tagColor} text-xs border-0`}>{course.tag}</Badge>
              <Badge variant="outline" className="text-xs">{course.category}</Badge>
              <span className="text-xs text-slate-400">{course.level}</span>
            </div>
            <p className="font-semibold text-slate-800">{course.title}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span>⏱ {course.duration}</span>
          <span>📚 {course.lessons} bài</span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">Tiến độ</span>
            <span className="text-xs font-semibold text-[#316585]">{course.progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-[#316585]'}`}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        <Button
          className={`w-full gap-2 text-sm ${isDone ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-[#316585] hover:bg-[#264f68] text-white'}`}
          onClick={() => toast.info('Mở khóa học — kết nối với LMS đang triển khai')}
        >
          {isDone ? (
            <><Star className="w-4 h-4 text-emerald-500" /> Ôn lại</>
          ) : course.progress > 0 ? (
            <><PlayCircle className="w-4 h-4" /> Tiếp tục học</>
          ) : (
            <><Zap className="w-4 h-4" /> Bắt đầu học</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SalesKnowledgeCenterPage() {
  const [activeTab, setActiveTab] = useState('tuvan');
  const [selectedScript, setSelectedScript] = useState(null);
  const [searchScript, setSearchScript] = useState('');

  const filteredScripts = SCRIPTS.filter(s =>
    !searchScript ||
    s.title.toLowerCase().includes(searchScript.toLowerCase()) ||
    s.category.toLowerCase().includes(searchScript.toLowerCase())
  );

  const LEVEL_CONFIG = {
    hot: { label: '🔥 Dùng nhiều nhất', color: 'bg-red-100 text-red-700 border-red-200' },
    warm: { label: '💡 Xây dựng nền tảng', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    action: { label: '⚡ Chốt hành động', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">📚 Trung tâm kiến thức</h1>
        <p className="text-sm text-slate-500 mt-0.5">Kịch bản tư vấn, hỏi đáp và đào tạo để sale tư vấn tự tin hơn</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-slate-200 pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white border border-b-white border-slate-200 -mb-px text-[#316585]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Kịch bản tư vấn */}
      {activeTab === 'tuvan' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm kịch bản..."
                value={searchScript}
                onChange={e => setSearchScript(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            {filteredScripts.map(script => {
              const lvl = LEVEL_CONFIG[script.level];
              return (
                <Card
                  key={script.id}
                  className="border shadow-none hover:border-[#316585]/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedScript(script)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-semibold text-slate-800">{script.title}</p>
                      <Badge className={`${lvl.color} border text-xs flex-shrink-0`}>{lvl.label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 italic mb-3">Tình huống: {script.situation}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{script.category}</Badge>
                      <Button size="sm" variant="ghost" className="text-[#316585] text-xs h-7">
                        Xem kịch bản →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: FAQ */}
      {activeTab === 'faq' && (
        <FAQAccordion categories={FAQ_CATEGORIES} />
      )}

      {/* Tab: Khóa học */}
      {activeTab === 'khoahoc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {COURSES.filter(c => c.progress === 100).length}/{COURSES.length} khóa đã hoàn thành
            </div>
            <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(COURSES.filter(c => c.progress === 100).length / COURSES.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {COURSES.map(course => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
      )}

      {/* Script Dialog */}
      {selectedScript && (
        <ScriptDialog script={selectedScript} onClose={() => setSelectedScript(null)} />
      )}
    </div>
  );
}
