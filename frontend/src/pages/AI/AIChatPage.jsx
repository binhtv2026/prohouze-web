/**
 * AIChatPage.jsx — D3
 * AI Chat Assistant — FAQ + quick actions + typing animation
 */
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Send, Bot, User, Zap } from 'lucide-react';

const SUGGESTED = [
  'Hoa hồng tính như thế nào?',
  'Quy trình booking là gì?',
  'Tôi cần đạt gì để thăng tiến?',
  'Làm sao định giá căn hộ?',
  'Hợp đồng thuê cần những gì?',
];

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome', role: 'ai',
      text: '👋 Xin chào! Tôi là AI Assistant của ProHouze.\n\nTôi có thể giúp bạn về:\n• Định giá BĐS\n• Quy trình booking & hợp đồng\n• Hoa hồng & KPI\n• Đào tạo & thăng tiến\n\nBạn cần hỗ trợ gì?',
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId] = useState(() => `conv-${Date.now()}`);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Typing indicator
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, role: 'ai', typing: true, time: new Date() }]);

    try {
      const res = await api.post('/ai/chat/message', { message: text, conversation_id: convId });
      setMessages(prev => prev
        .filter(m => m.id !== typingId)
        .concat({ id: Date.now() + 2, role: 'ai', text: res.data.response, quickActions: res.data.quick_actions?.slice(0,3), time: new Date() })
      );
    } catch {
      setMessages(prev => prev
        .filter(m => m.id !== typingId)
        .concat({ id: Date.now() + 2, role: 'ai', text: 'Xin lỗi, đang có sự cố kết nối. Vui lòng thử lại!', time: new Date() })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl" data-testid="ai-chat-page">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="text-2xl">🤖</span> AI Assistant
        </h1>
        <p className="text-sm text-slate-500">Hỏi bất cứ điều gì về BĐS, KPI, quy trình...</p>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-[#316585] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {msg.typing ? (
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#316585] text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              )}
              {/* Quick actions */}
              {msg.quickActions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.quickActions.map(qa => (
                    <a key={qa.id} href={qa.action}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-full text-slate-700 hover:border-[#316585] hover:text-[#316585] transition-colors">
                      {qa.icon} {qa.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-3 py-1.5 bg-[#316585]/5 border border-[#316585]/20 text-[#316585] rounded-full hover:bg-[#316585]/10 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <input
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Hỏi về hoa hồng, booking, pháp lý..."
          disabled={loading}
        />
        <Button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="bg-[#316585] hover:bg-[#264f68] px-4">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
