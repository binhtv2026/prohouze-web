/**
 * MobileSalesAIPage.jsx — AI Sales Assistant (A)
 * Gợi ý script theo ngữ cảnh · Phân tích khách · Phản đối → Xử lý
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Sparkles, User, Bot,
  Lightbulb, MessageSquare, BarChart3, Zap,
  ChevronRight, RefreshCw, Copy, CheckCheck,
  Building2, Phone,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── AI Response Engine (mock) ─────────────────────────────────────────────────
const AI_RESPONSES = {
  'xử lý từ chối giá': `**Kịch bản xử lý "Giá cao quá":**

🎯 **Bước 1 — Đồng cảm trước:**
"Anh/Chị hoàn toàn có lý. Đây là khoản đầu tư lớn và cần cân nhắc kỹ."

🔄 **Bước 2 — Tái định vị:**
"Thực ra với 30% đặt cọc (≈1.14 tỷ), anh sở hữu căn tại vị trí đắc địa Đà Nẵng. 70% còn lại NH hỗ trợ 0% lãi 24 tháng."

📊 **Bước 3 — So sánh ROI:**
"Tiền thuê từ NOBU 19tr/tháng > trả góp 15tr → anh có lời ngay từ tháng đầu!"

⚠️ **Tránh:** Đừng bao giờ giảm giá ngay lần đầu — mất uy tín.`,

  'khách chần chừ': `**Kịch bản "Để tôi suy nghĩ thêm":**

❌ **Đừng nói:** "Vâng anh cứ suy nghĩ nhé" → mất deal ngay!

✅ **Option 1 — Tìm nguyên nhân thật:**
"Em muốn hỗ trợ anh tốt hơn — điều anh còn băn khoăn là gì ạ? Giá, pháp lý, hay tiến độ?"

✅ **Option 2 — Tạo deadline:**
"Căn này đang có 2 khách khác xem. Em giữ cho anh 24h để quyết định nhé?"

✅ **Option 3 — Giảm rủi ro:**
"Đặt cọc 50 triệu refundable 100% trong 7 ngày — anh không mất gì cả."`,

  'giới thiệu nobu': `**Pitch NOBU Residences trong 60 giây:**

🏨 **Hook:** "Anh có biết Robert De Niro đang mang thương hiệu 5 sao của ông ấy đến Đà Nẵng không?"

🎯 **3 USP core:**
• Sổ đỏ riêng — sở hữu lâu dài ✅
• Cam kết thuê 6%/năm từ NOBU Hotel ✅  
• Thiết kế Kengo Kuma — kiến trúc sư hàng đầu Nhật Bản ✅

💰 **Số liệu chốt:**
• Chỉ 15% ký HĐMB, 0% lãi 24 tháng
• BĐS Đà Nẵng tăng 8-12%/năm lịch sử
• Hàng xóm: Marriott, Vinpearl, InterContinental

🔚 **Call to action:** "Anh có thể tham quan showroom thứ 7 này không? Em sắp xếp cho anh."`,

  'phân tích khách': `**Framework phân tích DISC cho khách BĐS:**

🔴 **D (Dominant) — Quyết đoán:**
- Dấu hiệu: Hỏi thẳng vào giá, ROI, số liệu
- Cách tiếp cận: Ngắn gọn, số liệu thực, không nói dài
- Chốt: "Đây là deal tốt nhất thị trường hiện tại"

🟡 **I (Influencing) — Xã giao:**
- Dấu hiệu: Thích chia sẻ, hỏi nhiều người khác mua chưa
- Cách tiếp cận: Kể câu chuyện, social proof, cảm xúc
- Chốt: "Nhiều anh chị trong giới đã mua rồi đấy"

🟢 **S (Steady) — Ổn định:**
- Dấu hiệu: Hỏi nhiều về rủi ro, pháp lý, bảo đảm
- Cách tiếp cận: Kiên nhẫn, dữ liệu tin cậy, không vội
- Chốt: "Em đảm bảo hoàn tiền 100% nếu pháp lý có vấn đề"

🔵 **C (Conscientious) — Phân tích:**
- Dấu hiệu: Hỏi rất nhiều, chi tiết, so sánh nhiều lần
- Cách tiếp cận: Báo cáo đầy đủ, so sánh, thời gian suy nghĩ
- Chốt: Gửi file PDF chi tiết + đặt lịch review sau 2 ngày`,

  default: `Xin chào! Tôi là **AI Sales Assistant** của ProHouze. Tôi có thể giúp bạn:

🎯 **Script bán hàng** — Gợi ý câu nói theo từng tình huống
🛡️ **Xử lý phản đối** — Phân tích và response cho mọi loại objection
📊 **Phân tích khách hàng** — DISC profiling, gợi ý approach
🏠 **Kiến thức dự án** — Thông tin NOBU, Sun Symphony, Sun Ponte...

Hỏi tôi bất kỳ điều gì về sales BĐS nhé! Ví dụ:
• "Xử lý từ chối giá như thế nào?"
• "Script giới thiệu NOBU Residences"
• "Khách chần chừ phải làm sao?"`,
};

function getBotResponse(input) {
  const lower = input.toLowerCase();
  if (lower.includes('giá') || lower.includes('đắt') || lower.includes('cao')) return AI_RESPONSES['xử lý từ chối giá'];
  if (lower.includes('chần chừ') || lower.includes('suy nghĩ') || lower.includes('chưa quyết')) return AI_RESPONSES['khách chần chừ'];
  if (lower.includes('nobu') || lower.includes('giới thiệu') || lower.includes('pitch')) return AI_RESPONSES['giới thiệu nobu'];
  if (lower.includes('phân tích') || lower.includes('khách') || lower.includes('disc')) return AI_RESPONSES['phân tích khách'];
  return AI_RESPONSES['default'];
}

const QUICK_PROMPTS = [
  { icon: '💰', label: 'Xử lý "Giá cao"', q: 'Xử lý từ chối giá như thế nào?' },
  { icon: '🤔', label: 'Khách chần chừ', q: 'Khách nói "để suy nghĩ thêm" thì làm gì?' },
  { icon: '🏨', label: 'Pitch NOBU', q: 'Giới thiệu NOBU Residences trong 60 giây' },
  { icon: '🧠', label: 'Phân tích KH', q: 'Phân tích tính cách khách hàng DISC' },
];

function Message({ msg }) {
  const [copied, setCopied] = useState(false);
  const isBot = msg.role === 'bot';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    toast.success('Đã copy!');
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-slate-900 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.match(/^[🎯🔄📊⚠️✅❌🏨💰🔚🔴🟡🟢🔵]/)) {
        return <p key={i} className="text-sm leading-relaxed mb-1.5">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('• ')) {
        return <p key={i} className="text-sm text-slate-700 mb-1 pl-2">• {line.slice(2).replace(/\*\*/g, '')}</p>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-sm text-slate-700 leading-relaxed mb-1">{line.replace(/\*\*/g, '')}</p>;
    });
  };

  return (
    <div className={`flex gap-2 mb-4 ${isBot ? 'items-start' : 'items-end flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-violet-600' : 'bg-[#316585]'}`}>
        {isBot ? <Sparkles className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[85%] ${isBot ? '' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${isBot ? 'bg-white border border-slate-100 shadow-sm' : 'bg-[#316585] text-white'}`}>
          {isBot ? renderContent(msg.content) : <p className="text-sm text-white">{msg.content}</p>}
        </div>
        {isBot && (
          <button onClick={handleCopy} className="flex items-center gap-1 mt-1 ml-2 text-xs text-slate-400">
            {copied ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Đã copy' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MobileSalesAIPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 0, role: 'bot', content: AI_RESPONSES['default'] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: q }]);
    setLoading(true);
    setTimeout(() => {
      const response = getBotResponse(q);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: response }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f8f7ff]">
      {/* HEADER */}
      <div className="flex-shrink-0 px-4 pt-12 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">AI Sales Assistant</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-xs text-emerald-600">Sẵn sàng hỗ trợ</p>
              </div>
            </div>
          </div>
          <button onClick={() => setMessages([{ id: 0, role: 'bot', content: AI_RESPONSES['default'] }])}
            className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Quick prompts */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_PROMPTS.map(p => (
            <button key={p.label} onClick={() => sendMessage(p.q)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-xs font-semibold text-violet-700">
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {loading && (
          <div className="flex gap-2 items-start mb-4">
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
        <div className="h-4" />
      </div>

      {/* INPUT */}
      <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Hỏi về script, xử lý phản đối, kiến thức dự án..."
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
