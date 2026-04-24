/**
 * MobileKnowledgePage.jsx — Kho Tri Thức (Base Square)
 * Script tư vấn, chính sách, Q&A xử lý từ chối, tài liệu đào tạo
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, BookOpen, Lightbulb, Shield, Star,
  ChevronRight, ThumbsUp, Eye, Tag, Bookmark, Copy, CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'all',      label: 'Tất cả',          icon: BookOpen,  color: 'bg-slate-500' },
  { key: 'script',   label: 'Script tư vấn',   icon: Lightbulb, color: 'bg-amber-500' },
  { key: 'objection',label: 'Xử lý từ chối',   icon: Shield,    color: 'bg-red-500' },
  { key: 'policy',   label: 'Chính sách',       icon: BookOpen,  color: 'bg-blue-500' },
  { key: 'product',  label: 'Kiến thức SP',     icon: Star,      color: 'bg-violet-500' },
];

const ARTICLES = [
  {
    id: 'k-001', category: 'script',
    title: '✅ Script mở đầu cuộc gọi cold call hiệu quả',
    summary: '5 câu mở đầu đã được kiểm chứng giúp tăng tỷ lệ giữ máy lên 60%+',
    content: `## Script mở đầu cold call

**Câu 1 — Thẳng vào vấn đề:**
"Anh/Chị [Tên], em [Tên] từ ProHouze. Em đang có dự án NOBU Residences vừa ra mắt, giá gốc chủ đầu tư, cam kết thuê 6%/năm. Anh có 2 phút không ạ?"

**Câu 2 — Đặt câu hỏi trước:**
"Anh/Chị có đang quan tâm đến đầu tư bất động sản nghỉ dưỡng lợi suất cao không ạ?"

**Câu 3 — Tạo khan hiếm:**
"Chỉ còn 3 căn cuối cùng ở tầng cao view biển, em muốn ưu tiên cho anh trước khi ra thị trường tự do."

**Tips:**
- Luôn gọi tên khách hàng
- Nói chậm, rõ ràng
- Không đọc như robot — nói tự nhiên`,
    views: 1240, likes: 89, isBookmarked: false, isNew: true, tags: ['cold_call', 'NOBU'],
  },
  {
    id: 'k-002', category: 'objection',
    title: '🛡️ Xử lý "Giá cao quá, tôi không có tiền"',
    summary: 'Framework 3 bước để chuyển hóa phản đối về giá thành cơ hội chốt',
    content: `## Framework xử lý phản đối GIÁ

**Bước 1 — Đồng cảm:**
"Em rất hiểu anh/chị. Đây là khoản tiền lớn và anh/chị cần cân nhắc kỹ."

**Bước 2 — Tái định vị:**
"Anh ơi, thực ra với 30% đặt cọc (≈1.14 tỷ), anh đã sở hữu căn hộ 3.8 tỷ tại vị trí đắc địa nhất Đà Nẵng. Phần còn lại ngân hàng hỗ trợ 70% lãi suất ưu đãi."

**Bước 3 — Tạo so sánh:**
"Mỗi tháng trả góp khoảng 15 triệu, nhưng tiền thuê từ NOBU Hotel Management là 19 triệu — thực ra anh đang có lời ngay từ tháng đầu tiên."

**KHÔNG làm:**
- Không giảm giá ngay → mất uy tín
- Không tranh cãi
- Không im lặng quá 3 giây`,
    views: 980, likes: 124, isBookmarked: true, isNew: false, tags: ['price_objection', 'financing'],
  },
  {
    id: 'k-003', category: 'product',
    title: '🏨 NOBU Residences — USP & Điểm khác biệt',
    summary: 'Tổng hợp 10 điểm bán hàng độc đáo của NOBU so với đối thủ',
    content: `## NOBU Residences — 10 USP

1. **Thương hiệu NOBU toàn cầu** — 56 nhà hàng & resort tại 30 quốc gia
2. **Cam kết thuê 6%/năm** trong 2 năm đầu (cam kết từ chủ đầu tư)
3. **Vị trí** — Mặt tiền biển Mỹ Khê, Đà Nẵng
4. **Pháp lý** — SỔ ĐỎ RIÊNG, sở hữu lâu dài
5. **Thiết kế Nhật Bản** — Kengo Kuma & Associates
6. **Tiện ích 5 sao** — pool, spa, gym, F&B
7. **Thanh toán linh hoạt** — chỉ 15% ký HĐMB, 0% lãi suất 24 tháng
8. **Quản lý chuyên nghiệp** — đội vận hành NOBU Hotel
9. **Lịch sử tăng giá** — BĐS Đà Nẵng tăng trung bình 8–12%/năm
10. **Hàng xóm** — Vinpearl, Marriott, InterContinental`,
    views: 2100, likes: 156, isBookmarked: false, isNew: true, tags: ['NOBU', 'USP'],
  },
  {
    id: 'k-004', category: 'policy',
    title: '📋 Chính sách hoa hồng mới — Tháng 04/2026',
    summary: 'Bảng tỷ lệ hoa hồng cập nhật và điều kiện thưởng thêm theo dự án',
    content: `## Bảng hoa hồng tháng 04/2026

| Dự án | Tỷ lệ | Ghi chú |
|---|---|---|
| NOBU Residences | **0.3%** | Căn thường |
| NOBU Residences | **0.35%** | Căn tầng cao > 15 |
| Sun Symphony | **0.25%** | Tất cả căn |
| Sun Ponte | **0.2%** | Standard |
| Vinhomes HVB | **Liên hệ BD** | Đang thỏa thuận |

## Thưởng KPI tháng
- **1 GD**: +500K
- **2 GD**: +1.5 triệu
- **3 GD+**: +3 triệu + vinh danh

## Lưu ý
- Hoa hồng tính trên giá NET (sau CK)
- Giải ngân khi khách đóng 30%
- KPI tính theo tháng dương lịch`,
    views: 3400, likes: 210, isBookmarked: true, isNew: true, tags: ['commission', 'policy'],
  },
  {
    id: 'k-005', category: 'objection',
    title: '🛡️ Xử lý "Để tôi suy nghĩ thêm"',
    summary: 'Khi khách chần chừ — 4 cách tạo quyết định mà không gây áp lực',
    content: `## Xử lý "Để suy nghĩ thêm"

**Không làm:** "Vâng, anh/chị cứ suy nghĩ đi nhé" → mất khách luôn

**Làm:**

**Option 1 — Tìm nguyên nhân thật:**
"Anh ơi, em muốn hỗ trợ anh tốt hơn — điều anh còn băn khoăn cụ thể là vấn đề gì ạ? Giá? Pháp lý? Hay tiến độ dự án?"

**Option 2 — Tạo deadline:**
"Hiện tại căn này đang được 2 khách khác tìm hiểu. Em có thể giữ cho anh 24h để anh quyết định không ạ?"

**Option 3 — Giảm rủi ro:**
"Để em đặt giữ chỗ cho anh với 50 triệu hoàn toàn refundable — anh có 7 ngày để quyết định, sau đó lấy lại 100%."

**Option 4 — Kể câu chuyện:**
Chia sẻ 1 case khách khác đã chần chừ và bỏ lỡ cơ hội tốt.`,
    views: 760, likes: 98, isBookmarked: false, isNew: false, tags: ['objection', 'closing'],
  },
  {
    id: 'k-006', category: 'script',
    title: '✅ Script giới thiệu dự án qua Zalo/Messenger 5 phút',
    summary: 'Template tin nhắn đã tối ưu tỷ lệ reply 40%+ cho môi giới BĐS',
    content: `## Template Zalo/Messenger

**Tin 1 — Chào hỏi:**
"Anh [Tên] ơi, em [Tên] — Sales ANKAPU ạ. Em đang có thông tin dự án NOBU Residences Đà Nẵng vừa mở bán Phase 2, em muốn chia sẻ với anh vì biết anh đang quan tâm BĐS nghỉ dưỡng. Anh có tiện không ạ? 🙏"

**Nếu reply "Có":**
"Cảm ơn anh! Em gửi anh 3 thông tin nhanh:
1️⃣ Vị trí: Mặt biển Mỹ Khê, Đà Nẵng
2️⃣ Cam kết thuê: 6%/năm/2 năm
3️⃣ Sổ đỏ riêng, sở hữu lâu dài
Anh có thể xem thêm không ạ?"

**Nếu không reply sau 24h:**
"Anh ơi, em vừa nhận thông tin căn hộ view biển tầng cao vừa có khách đặt cọc. Em muốn hỏi anh có còn quan tâm không ạ? 🙏"`,
    views: 1560, likes: 134, isBookmarked: false, isNew: false, tags: ['zalo', 'messaging', 'NOBU'],
  },
];

function ArticleCard({ article, onOpen }) {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORIES.find(c => c.key === article.category);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(article.content).then(() => {
      setCopied(true);
      toast.success('Đã copy nội dung!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100 active:scale-[0.99] transition-transform"
      onClick={() => onOpen(article)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {cat && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${cat.color}`}>
              {cat.label}
            </span>
          )}
          {article.isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">MỚI</span>
          )}
          {article.isBookmarked && (
            <Bookmark className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
          )}
        </div>
        <button onClick={handleCopy} className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      </div>

      <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1">{article.title}</h3>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{article.summary}</p>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views.toLocaleString()}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.likes}</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
      </div>
    </div>
  );
}

function ArticleDetail({ article, onClose }) {
  if (!article) return null;

  const lines = article.content.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-slate-100">
        <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <h2 className="font-bold text-slate-900 text-sm flex-1 line-clamp-2">{article.title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-2 flex-wrap mb-4">
          {article.tags.map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">#{tag}</span>
          ))}
        </div>

        <div className="prose prose-sm max-w-none">
          {article.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-slate-900 mt-4 mb-2">{line.replace('## ','')}</h2>;
            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-slate-800 mt-3 mb-1">{line.replace(/\*\*/g,'')}</p>;
            if (line.startsWith('- ') || line.startsWith('**- ')) return <li key={i} className="text-sm text-slate-700 mb-1 ml-4 list-disc">{line.replace(/^[\*\-\s]+/,'').replace(/\*\*/g,'')}</li>;
            if (line.match(/^\d+\./)) return <p key={i} className="text-sm text-slate-700 mb-1.5">{line}</p>;
            if (line.includes('|')) return <p key={i} className="text-xs font-mono bg-slate-50 px-2 py-1 rounded my-0.5">{line}</p>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="text-sm text-slate-700 mb-2 leading-relaxed">{line.replace(/\*\*/g,'')}</p>;
          })}
        </div>

        <div className="h-20" />
      </div>

      <div className="border-t border-slate-100 px-4 py-4">
        <button
          onClick={() => {
            navigator.clipboard.writeText(article.content);
            toast.success('✅ Đã copy toàn bộ nội dung!');
          }}
          className="w-full py-3 bg-[#316585] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy nội dung để dùng ngay
        </button>
      </div>
    </div>
  );
}

export default function MobileKnowledgePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openArticle, setOpenArticle] = useState(null);

  const filtered = useMemo(() => {
    return ARTICLES.filter(a => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Kho Tri Thức</h1>
            <p className="text-xs text-slate-500">Script, xử lý từ chối, chính sách</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full bg-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
            placeholder="Tìm script, xử lý từ chối..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.key
                  ? 'bg-[#316585] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ARTICLES */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-xs text-slate-400 mb-3">{filtered.length} tài liệu</p>
        {filtered.map(article => (
          <ArticleCard key={article.id} article={article} onOpen={setOpenArticle} />
        ))}
        <div className="h-20" />
      </div>

      {/* ARTICLE DETAIL */}
      {openArticle && (
        <ArticleDetail article={openArticle} onClose={() => setOpenArticle(null)} />
      )}
    </div>
  );
}
