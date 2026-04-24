/**
 * AICopilotDrawer.jsx — v2.0 (10/10 Locked)
 * ──────────────────────────────────────────────────────────────
 * Nâng cấp so với v1:
 * - Gọi backend API thật (POST /api/ai/copilot/chat)
 * - Auto-fallback local nếu API không khả dụng
 * - GPT/Local indicator trên header
 * - Suggestions chip sau mỗi câu trả lời
 * - Context-aware: biết user đang xem trang nào/dự án nào
 * - Markdown rich rendering (bảng, bullets, bold, số)
 * - Auto-resize textarea
 * - Scroll to bottom luôn đúng
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Sparkles, RefreshCw, Copy, ThumbsUp,
  ChevronDown, Wifi, WifiOff, Zap,
} from 'lucide-react';
import { sendCopilotMessage, checkCopilotHealth } from '@/lib/aiCopilotApi';
import { useLocation } from 'react-router-dom';

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MdText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-0.5" />;

        // Horizontal rule
        if (/^---+$/.test(line.trim())) return <hr key={i} className="border-white/10 my-1" />;

        // Table row
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(c => c.trim() && !/^[-:\s]+$/.test(c));
          if (!cells.length) return null;
          return (
            <div key={i} className="flex gap-1 text-[10px] flex-wrap">
              {cells.map((c, j) => (
                <span key={j}
                  className={`px-2 py-0.5 rounded-md flex-shrink-0 ${j === 0
                    ? 'bg-white/20 font-semibold text-white'
                    : 'bg-white/10 text-white/80'}`}>
                  {c.trim()}
                </span>
              ))}
            </div>
          );
        }

        // Section header (bold line alone)
        if (/^\*\*.+\*\*:?$/.test(line.trim())) {
          return <p key={i} className="font-bold text-white text-xs mt-1.5">{line.replace(/\*\*/g, '').replace(/:$/, '')}</p>;
        }

        // Bullet list
        if (/^[•\-*]\s/.test(line)) {
          const content = line.replace(/^[•\-*]\s/, '');
          return (
            <div key={i} className="flex gap-1.5 text-xs text-white/90">
              <span className="text-amber-300 flex-shrink-0 mt-0.5 text-[10px]">▸</span>
              <span dangerouslySetInnerHTML={{ __html: inlineBold(content) }} />
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)[1];
          const content = line.replace(/^\d+\.\s*/, '');
          return (
            <div key={i} className="flex gap-2 text-xs text-white/90">
              <span className="text-amber-300 font-bold flex-shrink-0 w-4 text-right">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: inlineBold(content) }} />
            </div>
          );
        }

        // Normal text
        return (
          <p key={i} className="text-xs text-white/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: inlineBold(line) }} />
        );
      })}
    </div>
  );
}

function inlineBold(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="bg-white/20 px-1 rounded text-amber-200 text-[10px]">$1</code>');
}

// ─── Quick actions per role ───────────────────────────────────────────────────
const QUICK_ACTIONS = {
  sale: [
    { label: '📋 Tổng quan NOBU', q: 'Tổng quan dự án NOBU Residences Danang?' },
    { label: '💰 Cam kết ROI', q: 'Cam kết thuê và chia doanh thu sau 2 năm?' },
    { label: '🏠 So sánh căn', q: 'So sánh Studio, 1PN, 2PN, 3DK, Sky Villa?' },
    { label: '📝 Script warm', q: 'Soạn script follow-up khách đang ấm?' },
    { label: '🛡️ Phản đối', q: 'Cách xử lý các phản đối condotel thường gặp?' },
    { label: '📋 Pháp lý', q: 'Pháp lý dự án NOBU đầy đủ chưa?' },
    { label: '🎁 Quyền lợi CSH', q: 'Chủ sở hữu được những quyền lợi gì từ Nobu?' },
    { label: '📊 KPI chuẩn', q: 'KPI hàng tháng cho nhân viên kinh doanh?' },
  ],
  manager: [
    { label: '📊 Đánh giá team', q: 'Tiêu chí đánh giá hiệu suất team kinh doanh?' },
    { label: '🔴 Deal rủi ro', q: 'Dấu hiệu nhận biết deal có nguy cơ mất khách?' },
    { label: '🎓 Coaching mới', q: 'Kịch bản coaching cho sale mới vào nghề?' },
    { label: '📅 Lịch follow-up', q: 'Quy trình follow-up chuẩn theo tình trạng lead?' },
  ],
  admin: [
    { label: '⚙️ Phân quyền', q: 'Các vai trò và phân quyền trong ProHouze?' },
    { label: '📋 Onboarding', q: 'Quy trình onboarding nhân viên mới?' },
    { label: '🔧 Cập nhật AI', q: 'Làm sao admin cập nhật knowledge base cho AI?' },
    { label: '📊 Báo cáo AI', q: 'AI có thể tạo báo cáo vận hành tự động không?' },
  ],
  director: [
    { label: '📈 Doanh thu', q: 'Tổng quan tình hình kinh doanh tháng này?' },
    { label: '⚠️ Rủi ro', q: 'Các rủi ro đang cần lãnh đạo chú ý?' },
    { label: '🏗️ Dự án', q: 'Tiến độ và tình hình dự án NOBU hiện tại?' },
    { label: '👥 Nhân sự', q: 'Tình hình nhân sự và hiệu suất đội ngũ?' },
  ],
};

const DEFAULT_ROLE = 'sale';

// ─── Single message bubble ────────────────────────────────────────────────────
function ChatMessage({ msg, onCopy, onSuggest }) {
  const [liked, setLiked] = useState(false);
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2.5`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[88%] ${isUser ? '' : 'flex-1'}`}>
        <div className={`px-3 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-br from-[#316585] to-[#1a4a6b] text-white rounded-br-sm'
            : 'bg-white/12 backdrop-blur-sm text-white rounded-bl-sm border border-white/10'
        }`}>
          {isUser
            ? <p className="text-xs leading-relaxed">{msg.content}</p>
            : <MdText text={msg.content} />
          }
        </div>

        {/* AI message footer */}
        {!isUser && (
          <>
            <div className="flex items-center gap-3 mt-1.5 px-1">
              <button onClick={() => onCopy(msg.content)}
                className="flex items-center gap-1 text-[9px] text-white/40 hover:text-white/70 transition-colors">
                <Copy className="w-2.5 h-2.5" /> Sao chép
              </button>
              <button onClick={() => setLiked(true)}
                className={`flex items-center gap-1 text-[9px] transition-colors ${liked ? 'text-amber-400' : 'text-white/40 hover:text-white/70'}`}>
                <ThumbsUp className="w-2.5 h-2.5" /> {liked ? 'Cảm ơn!' : 'Hữu ích'}
              </button>
              {msg.source === 'local' && (
                <span className="text-[8px] text-white/25">⚡ Local</span>
              )}
              {msg.source === 'gpt' && (
                <span className="text-[8px] text-emerald-400/60">✦ GPT</span>
              )}
            </div>

            {/* Suggestions */}
            {msg.suggestions?.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {msg.suggestions.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => onSuggest(s)}
                    className="text-[10px] px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-white/70 hover:text-white transition-all active:scale-95">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-start mb-2.5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white/12 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 160}ms` }} />
        ))}
        <span className="text-[10px] text-white/40 ml-1">Đang suy nghĩ...</span>
      </div>
    </div>
  );
}

// ─── MAIN DRAWER ──────────────────────────────────────────────────────────────
export function AICopilotDrawer({ isOpen, onClose, role: rawRole, userName = 'Bạn' }) {
  const role = rawRole || DEFAULT_ROLE;
  const location = useLocation?.() || {};
  const pageContext = location.pathname || 'home';

  // Derive project context from current page
  const projectId = pageContext.includes('catalog') || pageContext.includes('project')
    ? 'NBU' : null;

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      source: 'local',
      content: `Xin chào **${userName}**! 👋 Tôi là trợ lý AI ProHouze.\n\nTôi biết toàn bộ thông tin về **NOBU Residences Danang** — cam kết, chính sách, pháp lý, script tư vấn. Hỏi tôi bất cứ điều gì!\n\n*Chọn câu hỏi nhanh bên dưới hoặc nhập câu hỏi của bạn.*`,
      suggestions: [],
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `s_${Date.now()}`);
  const [apiStatus, setApiStatus] = useState('checking'); // 'gpt' | 'local' | 'checking'
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.sale;

  // Check API health on open
  useEffect(() => {
    if (isOpen) {
      checkCopilotHealth().then(h => {
        setApiStatus(h.online && h.gptAvailable ? 'gpt' : 'local');
      });
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Always scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = '36px'; ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`; }
  };

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || isTyping) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '36px';

    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const resp = await sendCopilotMessage({
        message: q, sessionId, role, userName, pageContext, projectId, history,
      });

      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: resp.message,
        source: resp.source,
        suggestions: resp.suggestions || [],
      }]);

      // Update api status based on what was actually used
      if (resp.source === 'gpt') setApiStatus('gpt');

    } catch (_) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        source: 'local',
        content: 'Có lỗi xảy ra. Hãy thử lại nhé! 🔄',
        suggestions: [],
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, sessionId, role, userName, pageContext, projectId]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearChat = () => {
    setMessages([{
      id: `w_${Date.now()}`,
      role: 'assistant',
      source: 'local',
      content: '💬 Chat mới. Tôi vẫn nhớ toàn bộ kiến thức về NOBU Danang. Hỏi tôi nhé!',
      suggestions: ['Cam kết thuê 6% là thế nào?', 'So sánh các loại căn?', 'Pháp lý đầy đủ chưa?'],
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div
        className="relative flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          height: '90vh',
          background: 'linear-gradient(165deg, #16103a 0%, #0f1529 50%, #0a0e1a 100%)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0.5 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white text-sm leading-none">AI ProHouze</p>
                {/* Connection indicator */}
                {apiStatus === 'gpt' && (
                  <span className="flex items-center gap-0.5 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                    <Zap className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[9px] text-emerald-400 font-semibold">GPT</span>
                  </span>
                )}
                {apiStatus === 'local' && (
                  <span className="flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                    <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[9px] text-amber-400 font-semibold">Local</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] text-white/45">NOBU Danang · {role}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={clearChat}
              title="Làm mới chat"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90">
              <RefreshCw className="w-4 h-4 text-white/50" />
            </button>
            <button 
              onClick={onClose}
              className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 rounded-full transition-all active:scale-95 ml-1"
            >
              <span className="text-[11px] font-bold text-rose-300">THOÁT</span>
              <X className="w-4 h-4 text-rose-300" />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollBehavior: 'smooth' }}>
          {messages.map(msg => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              onCopy={handleCopy}
              onSuggest={q => sendMessage(q)}
            />
          ))}
          {isTyping && <TypingDots />}
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* ── Quick actions ── */}
        <div className="border-t border-white/8 flex-shrink-0 px-4 py-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {quickActions.map(a => (
              <button key={a.label}
                onClick={() => sendMessage(a.q)}
                disabled={isTyping}
                className="flex-shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full bg-white/10 text-white/75 hover:bg-white/20 border border-white/10 transition-all active:scale-95 whitespace-nowrap disabled:opacity-40">
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input ── */}
        <div className="px-4 pb-safe-bottom pb-6 pt-1.5 flex-shrink-0">
          <div className="flex items-end gap-2 bg-white/10 rounded-2xl px-4 py-2 border border-white/15 shadow-inner">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder="Hỏi về dự án, chính sách, soạn script..."
              rows={1}
              className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-white/35 leading-relaxed"
              style={{ height: '36px', maxHeight: '100px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className={`p-2 rounded-xl transition-all flex-shrink-0 active:scale-90 ${
                input.trim() && !isTyping
                  ? 'shadow-lg'
                  : 'bg-white/10 text-white/25'
              }`}
              style={input.trim() && !isTyping
                ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }
                : {}}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          {copied && <p className="text-center text-[10px] text-emerald-400 mt-1">✅ Đã sao chép</p>}
          <p className="text-center text-[9px] text-white/20 mt-1.5">
            AI hỗ trợ nội bộ · Nguồn: tài liệu chính thức VCRE 2024
          </p>
        </div>
      </div>
    </div>
  );
}

export default AICopilotDrawer;
